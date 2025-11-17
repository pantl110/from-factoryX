from api.security import jwt_auth
from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.pagination import CustomPageNumberPagination
from django.http import Http404
from django.shortcuts import get_object_or_404
from asgiref.sync import sync_to_async
from datetime import datetime, timedelta, date
from django.utils import timezone
from django.conf import settings
import pytz

from document.models import Quotation, QuotationProduct
from document.schemas.inbound import (
    QuotationDraftIn,
    QuotationConfirmedIn,
    QuotationProductDeliveryUpdateIn,
)
from document.schemas.outbound import (
    QuotationProductOut,
    QuotationConfirmedOut,
    UndeliveredQuotationProductOut,
)
from stock.models import Product
from project.models import Project, ProjectPlan
from factory.models import FactoryClient, FactoryEquipment, Factory
from factory.utils import is_factory_member
from stock.schemas.outbound import ProductRowOut
from factory.schemas.outbound import FactoryClientRowOut, FactoryRowOut


router = Router(tags=["QuotationProduct"], auth=jwt_auth)


@router.post(
    "/save",
    summary="견적서 생성 & 임시 저장 & 주문 확정",
    description="견적서를 생성하거나 임시로 저장합니다. 필수 필드가 비어있어도 저장되며, 입력이 완료되면 주문 확정할 수 있습니다.",
)
async def save_draft_quotation(request, payload: QuotationDraftIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory = await Factory.objects.aget(id=int(factory_id))

        # 주문 확정(is_confirm=True) 시에는 quotation_id가 필수
        # 2025.09.10 : dale : is confirm 이 true일 때도 quotationid가 없을 수 있음 (ocr data로 바로 주문서를 생성한 경우)
        # if payload.is_confirm and payload.quotation_id is None:
        #     raise HttpError(400, "is_confirm가 True일 때는 quotation_id가 필요합니다.")

        if payload.quotation_id is None:
            # 새 프로젝트와 견적서 생성 (project 생성 API 로직 참고)
            new_project = await Project.objects.acreate()
            quotation = await Quotation.objects.acreate(
                project=new_project,
                factory=factory,
                factory_info=FactoryRowOut.from_orm(factory).dict(),
            )
        else:
            # 기존 견적서 조회 및 검증
            try:
                quotation = await Quotation.objects.select_related(
                    "project", "factory"
                ).aget(id=payload.quotation_id)
            except Quotation.DoesNotExist:
                raise HttpError(404, "해당 견적서를 찾을 수 없습니다.")

            if quotation.factory_id != int(factory_id):
                raise HttpError(403, "해당 공장의 견적서가 아닙니다.")

        if payload.client:
            client_data = payload.client
            factory = quotation.factory

            # 클라이언트 ID가 제공된 경우
            if client_data.client_id is not None:
                try:
                    # 기존 클라이언트 조회
                    client = await FactoryClient.objects.aget(
                        id=client_data.client_id, factory=factory
                    )

                    # 클라이언트 정보가 변경된 경우 업데이트 (간결화)
                    updated = False
                    updatable_fields = [
                        "name",
                        "business_registration_number",
                        "representative_name",
                        "business_type",
                        "business_category",
                        "address",
                        "manager",
                        "email",
                        "phone",
                        "fax",
                    ]
                    for field_name in updatable_fields:
                        new_value = getattr(client_data, field_name, None)
                        if new_value != getattr(client, field_name):
                            setattr(client, field_name, new_value)
                            updated = True

                    # 역할 플래그 업데이트 규칙:
                    # - is_customer는 항상 True로 설정
                    # - is_supplier는 기존 값 유지
                    if client.is_customer is not True:
                        client.is_customer = True
                        updated = True

                    if updated:
                        await client.asave()

                except FactoryClient.DoesNotExist:
                    raise HttpError(
                        404,
                        f"클라이언트 ID {client_data.client_id}를 찾을 수 없습니다.",
                    )
            else:
                # 클라이언트 ID가 없는 경우 새로 생성
                # is_customer는 자동으로 True로 설정, is_supplier는 처음 생성 시 무조건 False
                new_is_customer = True
                new_is_supplier = False
                client = await FactoryClient.objects.acreate(
                    factory=factory,
                    name=client_data.name,
                    business_registration_number=client_data.business_registration_number,
                    representative_name=client_data.representative_name,
                    business_type=client_data.business_type,
                    business_category=client_data.business_category,
                    address=client_data.address,
                    manager=client_data.manager,
                    email=client_data.email,
                    phone=client_data.phone,
                    fax=client_data.fax,
                    is_customer=new_is_customer,
                    is_supplier=new_is_supplier,
                )

            quotation.client = client
            quotation.client_info = FactoryClientRowOut.from_orm(client).dict()

        if payload.due_date:
            # 시간 정보가 포함된 경우와 날짜만 있는 경우 모두 처리
            try:
                # "YYYY-MM-DD HH:MM" 형식 시도
                quotation.due_date = datetime.strptime(
                    payload.due_date, "%Y-%m-%d %H:%M"
                ).date()
            except ValueError:
                try:
                    # "YYYY-MM-DD" 형식 시도
                    quotation.due_date = datetime.strptime(
                        payload.due_date, "%Y-%m-%d"
                    ).date()
                except ValueError:
                    raise HttpError(
                        400,
                        "올바르지 않은 날짜 형식입니다. YYYY-MM-DD 또는 YYYY-MM-DD HH:MM 형식을 사용하세요.",
                    )
        if payload.uploaded_file:
            quotation.uploaded_file = payload.uploaded_file

        await quotation.asave()

        project = quotation.project
        if payload.is_confirm:
            project.status = Project.ProjectStatus.confirmed
        else:
            project.status = Project.ProjectStatus.quotation
        await project.asave()

        if payload.products is not None:
            await QuotationProduct.objects.filter(quotation=quotation).adelete()

            if payload.products:
                for prod in payload.products:
                    # 임시저장에서는 필수 필드가 없을 수 있음
                    if prod.product_id is None:
                        continue  # product_id가 없으면 건너뛰기

                    try:
                        product = (
                            await Product.objects.select_related("factory")
                            .prefetch_related("location")
                            .aget(id=prod.product_id)
                        )
                    except Product.DoesNotExist:
                        raise HttpError(404, "해당 제품을 찾을 수 없습니다.")

                    # 기본값 설정
                    quantity = prod.quantity if prod.quantity is not None else 0
                    unit_price = prod.unit_price if prod.unit_price is not None else 0

                    # delivery_date 시간 처리
                    delivery_date = None
                    if prod.delivery_date:
                        try:
                            # "YYYY-MM-DD HH:MM" 형식 시도
                            delivery_date = datetime.strptime(
                                prod.delivery_date, "%Y-%m-%d %H:%M"
                            ).date()
                        except ValueError:
                            try:
                                # "YYYY-MM-DD" 형식 시도
                                delivery_date = datetime.strptime(
                                    prod.delivery_date, "%Y-%m-%d"
                                ).date()
                            except ValueError:
                                raise HttpError(
                                    400,
                                    "올바르지 않은 납품일자 형식입니다. YYYY-MM-DD 또는 YYYY-MM-DD HH:MM 형식을 사용하세요.",
                                )

                    await QuotationProduct.objects.acreate(
                        quotation=quotation,
                        product=product,
                        # 상품이 변경되어도 변경되지 않는 product의 정보를 저장
                        product_info=ProductRowOut.from_orm(product).dict(),
                        quantity=quantity,
                        unit_price=unit_price,
                        is_delivery=prod.is_delivery,
                        delivery_date=delivery_date,
                    )

        return 200, {
            "quotation_id": quotation.id,
            "project_id": project.id,
            "client_id": quotation.client_id,
            "status": "confirmed" if payload.is_confirm else "draft_saved",
        }

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"생성 또는 임시 저장 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/confirmed",
    summary="생산 대기",
    description="완성된 견적서로 생산 대기 상태로 변경합니다. 모든 필수 정보가 필요합니다.",
    response={200: QuotationConfirmedOut, 400: dict, 404: dict, 500: dict},
)
async def confirm_order(request, payload: QuotationConfirmedIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    factory = await Factory.objects.aget(id=factory_id)
    await is_factory_member(int(factory_id), user)

    try:
        try:
            quotation = await sync_to_async(get_object_or_404)(
                Quotation, id=payload.quotation_id
            )
        except Http404:
            raise HttpError(404, "해당 견적서를 찾을 수 없습니다.")

        if not payload.quotation_id:
            raise HttpError(400, "견적서 ID는 필수입니다.")

        if not payload.client:
            raise HttpError(400, "클라이언트 정보는 필수입니다.")

        if not payload.products:
            raise HttpError(400, "품목 정보는 필수입니다.")

        client_data = payload.client
        # factory = await sync_to_async(lambda: quotation.factory)()

        # 클라이언트 ID가 제공된 경우
        updated = False  # 기본값 설정

        if client_data.client_id is not None:
            try:
                # 기존 클라이언트 조회
                client = await FactoryClient.objects.aget(
                    id=client_data.client_id, factory=factory
                )

                # 클라이언트 정보가 변경된 경우 업데이트
                updated = False
                if client_data.name != client.name:
                    client.name = client_data.name
                    updated = True
                if (
                    client_data.business_registration_number
                    != client.business_registration_number
                ):
                    client.business_registration_number = (
                        client_data.business_registration_number
                    )
                    updated = True
                if client_data.representative_name != client.representative_name:
                    client.representative_name = client_data.representative_name
                    updated = True
                if client_data.business_type != client.business_type:
                    client.business_type = client_data.business_type
                    updated = True
                if client_data.business_category != client.business_category:
                    client.business_category = client_data.business_category
                    updated = True
                if client_data.address != client.address:
                    client.address = client_data.address
                    updated = True
                if client_data.email != client.email:
                    client.email = client_data.email
                    updated = True
                if client_data.phone != client.phone:
                    client.phone = client_data.phone
                    updated = True
                if client_data.fax != client.fax:
                    client.fax = client_data.fax
                    updated = True

                # 역할 플래그 업데이트 규칙:
                # - is_customer는 항상 True로 설정
                # - is_supplier는 기존 값 유지
                if client.is_customer is not True:
                    client.is_customer = True
                    updated = True

            except FactoryClient.DoesNotExist:
                raise HttpError(
                    404, f"클라이언트 ID {client_data.client_id}를 찾을 수 없습니다."
                )
        else:
            # 클라이언트 ID가 없는 경우 새로 생성 (아직 저장하지 않음)
            # is_customer는 자동으로 True로 설정, is_supplier는 처음 생성 시 무조건 False
            new_is_customer = True
            new_is_supplier = False
            client = FactoryClient(
                factory=factory,
                name=client_data.name,
                business_registration_number=client_data.business_registration_number,
                representative_name=client_data.representative_name,
                business_type=client_data.business_type,
                business_category=client_data.business_category,
                address=client_data.address,
                email=client_data.email,
                phone=client_data.phone,
                fax=client_data.fax,
                is_customer=new_is_customer,
                is_supplier=new_is_supplier,
            )

        quotation.client = client

        if payload.due_date:
            quotation.due_date = datetime.strptime(payload.due_date, "%Y-%m-%d").date()
            # 아직 저장하지 않음

        await QuotationProduct.objects.filter(quotation=quotation).adelete()

        quotation_products = []  # 생성된 QuotationProduct 객체들을 저장할 리스트

        for prod in payload.products:
            try:
                product_id = prod.product_id
                if not product_id:
                    raise HttpError(400, "제품 ID는 필수입니다.")

                product = await sync_to_async(get_object_or_404)(Product, id=product_id)
            except Http404:
                raise HttpError(404, "해당 제품을 찾을 수 없습니다.")
            quotation_product = QuotationProduct(
                quotation=quotation,
                product=product,
                quantity=prod.quantity,
                unit_price=prod.unit_price,
            )
            quotation_products.append(quotation_product)  # 리스트에 추가
            # 아직 저장하지 않음

        project = await sync_to_async(lambda: quotation.project)()
        project.status = Project.ProjectStatus.pending
        project.confirmed_at = timezone.now().date()
        # 아직 저장하지 않음

        production_plans = []

        for i, prod in enumerate(payload.products):
            try:
                product_id = prod.product_id
                # 생성된 QuotationProduct 객체 사용
                quotation_product = quotation_products[i]
            except IndexError:
                raise HttpError(
                    500,
                    f"제품 ID {product_id}에 해당하는 견적 품목을 찾을 수 없습니다.",
                )

            try:
                equipment = (
                    await FactoryEquipment.objects.filter(
                        factory=factory, status=FactoryEquipment.EquipmentStatus.standby
                    )
                    .order_by("priority")
                    .afirst()
                )
                if not equipment:
                    raise HttpError(400, "해당 공장에 가동 가능한 설비가 없습니다.")
            except Exception as e:
                raise HttpError(400, f"설비 조회 중 오류가 발생했습니다: {str(e)}")

            product = await sync_to_async(lambda: quotation_product.product)()
            buffer_rate = float(product.buffer_rate)
            base_quantity = prod.quantity
            production_quantity = int(base_quantity * (1 + buffer_rate))

            # 현재 시간을 기준으로 시작 시간 설정
            start_datetime = timezone.now()
            start_date = start_datetime.strftime("%Y-%m-%d")

            # 평균 생산 시간을 반영하여 마감 일자 계산
            # 총 생산 시간 = 생산 수량 * 평균 생산 시간(초)
            avg_production_time = product.average_production_time or 30  # 기본값 30초
            total_production_seconds = production_quantity * avg_production_time

            # 총 생산 시간을 일자로 변환
            production_days = max(
                1, int(total_production_seconds / (24 * 3600))
            )  # 24시간 기준

            end_datetime = start_datetime + timedelta(days=production_days)
            end_date = end_datetime.strftime("%Y-%m-%d")

            # 생산 계획 데이터 준비 (저장은 나중에)
            project_plan_data = {
                "project": project,
                "product": quotation_product,
                "quantity": production_quantity,
                "equipment": equipment,
                "start_date": start_datetime,
                "end_date": end_datetime,
                "avg_production_time": avg_production_time,
            }

            # 생산 계획 데이터 저장 (plan_id는 나중에 추가)
            production_plan_info = {
                "project_plan_data": project_plan_data,
                "product_name": product.name,
                "quantity": production_quantity,
                "equipment_name": equipment.name,
                "start_date": start_datetime.strftime("%Y-%m-%d %H:%M"),
                "end_date": end_datetime.strftime("%Y-%m-%d %H:%M"),
                "avg_production_time": avg_production_time,
                "production_days": production_days,
            }
            production_plans.append(production_plan_info)

        # 모든 작업이 성공적으로 완료된 후에만 저장
        try:
            print(f"[SAVE] Starting save process...")

            # 1. 클라이언트 저장
            if updated:
                print(f"[SAVE] Saving updated client...")
                await sync_to_async(client.save)()
            else:
                print(f"[SAVE] Saving new client...")
                await sync_to_async(client.save)()

            # 2. quotation 저장
            print(f"[SAVE] Saving quotation...")
            await sync_to_async(quotation.save)()

            # 3. quotation_products 저장
            print(f"[SAVE] Saving {len(quotation_products)} quotation products...")
            for i, qp in enumerate(quotation_products):
                print(f"[SAVE] Saving quotation product {i+1}...")
                await sync_to_async(qp.save)()

            # 3-1. quotation의 products_info 업데이트
            print(f"[SAVE] Updating quotation products_info...")
            products_info = []
            for qp in quotation_products:
                product_info = {
                    "id": qp.product.id,
                    "name": qp.product.name,
                    "code": qp.product.code,
                    "spec": qp.product.spec,
                    "unit": qp.product.unit,
                    "quantity": qp.quantity,
                    "unit_price": qp.unit_price,
                    "total_price": qp.quantity * qp.unit_price,
                    "quotation_product_id": qp.id,
                }
                products_info.append(product_info)

            quotation.products_info = products_info
            await sync_to_async(quotation.save)()

            # 4. project 저장
            print(f"[SAVE] Saving project...")
            await sync_to_async(project.save)()

            # 5. 생산 계획 저장
            print(f"[SAVE] Creating production plans...")
            for i, plan_info in enumerate(production_plans):
                plan_data = plan_info["project_plan_data"]
                project_plan = await ProjectPlan.objects.acreate(**plan_data)
                # 생성된 plan_id 추가
                plan_info["plan_id"] = project_plan.id
                print(f"[SAVE] Created production plan {i+1} with ID {project_plan.id}")

            print(f"[SAVE] All saves completed successfully!")

        except Exception as save_error:
            # 저장 중 에러 발생 시 상세 로깅
            print(f"[SAVE ERROR] {str(save_error)}")
            print(f"[SAVE ERROR] Error type: {type(save_error)}")
            import traceback

            print(f"[SAVE ERROR] Traceback: {traceback.format_exc()}")
            raise HttpError(
                500, f"데이터 저장 중 오류가 발생했습니다: {str(save_error)}"
            )

        # production_plans에서 project_plan_data 제거 (응답에 불필요한 데이터)
        clean_production_plans = []
        for plan_info in production_plans:
            clean_plan = {
                k: v for k, v in plan_info.items() if k != "project_plan_data"
            }
            clean_production_plans.append(clean_plan)

        return 200, {
            "quotation_id": quotation.id,
            "project_id": project.id,
            "status": "production_waiting",
            "created_at": timezone.now(),
            "due_date": quotation.due_date.isoformat() if quotation.due_date else None,
            "production_plans": clean_production_plans,
        }

    except HttpError:
        raise
    except Exception as e:
        print(f"[CONFIRMATION ERROR] {str(e)}")
        print(f"[CONFIRMATION ERROR] Error type: {type(e)}")
        import traceback

        print(f"[CONFIRMATION ERROR] Traceback: {traceback.format_exc()}")
        raise HttpError(500, f"주문 확정 중 오류가 발생했습니다: {str(e)}")


# Quotation Tab
@router.get(
    "/",
    summary="[C] 견적서 품목 목록 조회",
    response={200: list, 400: dict, 404: dict, 500: dict},
)
async def list_quotation_products(request, quotation_id: int = Query(None)):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        if quotation_id:
            qps = await sync_to_async(list)(
                QuotationProduct.objects.select_related("product").filter(
                    quotation_id=quotation_id, quotation__factory_id=int(factory_id)
                )
            )
        else:
            qps = await sync_to_async(list)(
                QuotationProduct.objects.select_related("product").filter(
                    quotation__factory_id=int(factory_id)
                )
            )
    except Exception as e:
        raise HttpError(500, f"조회 중 오류: {str(e)}")

    if not qps:
        raise HttpError(404, "품목이 없습니다.")

    return 200, [
        {
            "id": qp.id,
            "quotation": qp.quotation_id,
            "product": qp.product_id,
            "product_name": qp.product.name,
            "product_code": qp.product.code,
            "product_spec": qp.product.spec,
            "product_unit": qp.product.unit,
            "quantity": qp.quantity,
            "unit_price": qp.unit_price,
            "is_delivery": qp.is_delivery,
            "delivery_date": qp.delivery_date.isoformat() if qp.delivery_date else None,
        }
        for qp in qps
    ]


@router.get(
    "/undelivered",
    summary="[C] 납품되지 않은 견적서 품목 조회",
    description=(
        "기본적으로 프로젝트가 납품 상태이고 납품되지 않은 견적서 품목을 페이지네이션하여 조회합니다. "
        "base_date가 전달되면 해당 날짜를 기준으로 일주일 이내(과거 포함)의 납품 예정 품목을 조회하며, 이 경우 생산대기/생산중/생산완료/납품 상태의 프로젝트를 모두 포함합니다. "
    ),
    response={
        200: list[UndeliveredQuotationProductOut],
        400: dict,
        500: dict,
    },
)
@paginate(CustomPageNumberPagination, page_size=5)
async def list_undelivered_quotation_products(
    request,
    base_date: str | None = Query(
        None, description="기준 날짜 (YYYY-MM-DD)"
    ),
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        # 기준 날짜가 전달된 경우: base_date 기반 로직
        if base_date:
            try:
                base = datetime.strptime(base_date, "%Y-%m-%d").date()
            except ValueError:
                raise HttpError(
                    400, "base_date는 YYYY-MM-DD 형식이어야 합니다."
                )
            week_later = base + timedelta(days=7)

            queryset = QuotationProduct.objects.select_related(
                "quotation__client", "quotation__project", "product"
            ).filter(
                quotation__factory_id=int(factory_id),
                quotation__project__status__in=[
                    "pending",      # 생산 대기
                    "production",  # 생산 중
                    "manufactured", # 생산 완료
                    "delivery",     # 납품
                ],
                is_delivery=False,  # 납품완료되지 않음
                delivery_date__lte=week_later,  # 기준 날짜로부터 일주일 이내 (과거 포함)
            )
            
        else:
            # 기존 로직: 프로젝트 상태가 납품인 프로젝트에서 납품이 되지 않은 견적서 품목 목록
            queryset = QuotationProduct.objects.select_related(
                "quotation__client", "quotation__project", "product"
            ).filter(
                quotation__factory_id=int(factory_id),
                quotation__project__status="delivery",
                is_delivery=False,
            )

        # delivery_date 오름차순 정렬 (가장 과거 납품일 먼저)
        queryset = queryset.order_by("delivery_date")

        undelivered_products = await sync_to_async(list)(queryset)

        # 응답 데이터 구성
        results = []
        for qp in undelivered_products:
            results.append(
                {
                    "company_name": qp.quotation.client.name,  # 업체명
                    "product_name": qp.product.name,  # 품목명
                    "product_code": qp.product.code if qp.product else None,  # 품목코드
                    "product_unit": qp.product.unit if qp.product else None,  # 품목 단위
                    "quantity": qp.quantity,  # 수량
                    "delivery_date": (
                        qp.quotation.due_date.isoformat()
                        if qp.quotation and qp.quotation.due_date
                        else None
                    ),  # 납기일자 (견적서 기준)
                    "project_id": qp.quotation.project.id,  # 프로젝트 ID
                }
            )

        return results

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"조회 중 오류가 발생했습니다: {str(e)}")


# Quotation Tab
@router.get(
    "/history",
    summary="[C] 견적서 품목 히스토리 조회",
    description="이전에 생산하였던 Quotation Product 항목을 조회합니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict},
)
async def list_history_quotation_product(request):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    product_ids = request.GET.get("product_ids")
    if not product_ids:
        raise HttpError(400, "product_ids를 입력해야 합니다.")

    try:
        product_id_list = [
            int(pid.strip()) for pid in product_ids.split(",") if pid.strip()
        ]

        if not product_id_list:
            raise HttpError(400, "product_ids를 입력해야 합니다.")

        qps = await sync_to_async(list)(
            QuotationProduct.objects.select_related("product")
            .filter(
                product__id__in=product_id_list,
                unit_price__gt=0,  # 단가 0 제외
                quantity__gt=0,    # 수량 0 제외 => 반품해서 생긴 quotation product 제외하기 위함
            )
            .order_by("-created_at")
        )

        if not qps:
            raise HttpError(404, "해당 제품의 견적 내역이 없습니다.")

        results = []
        for qp in qps:
            results.append(
                {
                    "product_name": qp.product.name,
                    "quantity": qp.quantity,
                    "unit_price": qp.unit_price,
                    "total_amount": qp.quantity * qp.unit_price,
                    "created_at": qp.created_at,
                }
            )

        return 200, {"results": results}

    except ValueError:
        raise HttpError(400, "product_ids는 콤마로 구분된 정수여야 합니다.")
    except Exception as e:
        raise HttpError(500, f"조회 중 오류: {str(e)}")


@router.get(
    "/{quotation_product_id}",
    summary="[C] 견적서 품목 상세 조회",
    response={200: QuotationProductOut, 404: dict, 500: dict},
)
async def get_quotation_product_detail(request, quotation_product_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        qp = await QuotationProduct.objects.aget(id=quotation_product_id)
    except QuotationProduct.DoesNotExist:
        raise HttpError(404, "해당 품목을 찾을 수 없습니다.")
    except Exception as e:
        raise HttpError(500, f"조회 중 오류: {str(e)}")
    return 200, {
        "id": qp.id,
        "quotation": qp.quotation_id,
        "product": qp.product_id,
        "quantity": qp.quantity,
        "unit_price": qp.unit_price,
        "is_delivery": qp.is_delivery,
        "delivery_date": qp.delivery_date.isoformat() if qp.delivery_date else None,
    }


@router.patch(
    "/{quotation_product_id}/delivery",
    summary="[C] 견적서 품목 납품 상태 수정",
    description="견적서 품목의 납품 상태(is_delivery)와 납품일자(delivery_date)를 수정합니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict},
)
async def update_quotation_product_delivery(
    request, quotation_product_id: int, payload: QuotationProductDeliveryUpdateIn
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        # 견적서 품목 조회
        quotation_product = await QuotationProduct.objects.select_related(
            "quotation"
        ).aget(id=quotation_product_id)

        # 해당 공장의 견적서인지 확인
        if quotation_product.quotation.factory_id != int(factory_id):
            raise HttpError(403, "해당 공장의 견적서 품목이 아닙니다.")

        # 납품 상태 업데이트
        quotation_product.is_delivery = payload.is_delivery

        # 납품일자 업데이트
        if payload.delivery_date:
            quotation_product.delivery_date = datetime.strptime(
                payload.delivery_date, "%Y-%m-%d"
            ).date()
        else:
            quotation_product.delivery_date = None

        await sync_to_async(quotation_product.save)()

        return 200, {
            "quotation_product_id": quotation_product.id,
            "is_delivery": quotation_product.is_delivery,
            "delivery_date": (
                quotation_product.delivery_date.isoformat()
                if quotation_product.delivery_date
                else None
            ),
            "message": "납품 상태가 성공적으로 업데이트되었습니다.",
        }

    except QuotationProduct.DoesNotExist:
        raise HttpError(404, "해당 견적서 품목을 찾을 수 없습니다.")
    except ValueError as e:
        raise HttpError(400, f"날짜 형식이 올바르지 않습니다: {str(e)}")
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"납품 상태 수정 중 오류가 발생했습니다: {str(e)}")
