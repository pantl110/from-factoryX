from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from django.db.models import Exists, OuterRef
from asgiref.sync import sync_to_async
from datetime import date, timedelta, datetime
from api.security import jwt_auth
from typing import List

from project.models import Project, ProjectPlan
from project.schemas.inbound import (
    ProjectStatusUpdateIn,
    ProjectTransactDateUpdateIn,
    ProjectCloneIn,
    ProjectListFilter,
)
from project.schemas.outbound import (
    ListProgressProjectOut,
    ProjectDetailOut,
    ProjectUpdateOut,
    ProjectStatusDetailOut,
    ProjectCloneOut,
)
from factory.utils import is_factory_member
from document.models import Quotation, QuotationProduct
from project.models import ProjectPlan, ProjectLog
from project.utils import get_project_by_id
from helpers.material_consumption import process_material_consumption
from django.utils import timezone

router = Router(tags=["Project"], auth=jwt_auth)


# Project Tab
# @router.post(
#     "",
#     summary="[C] 프로젝트 생성",
#     description="프로젝트와 견적서를 동시에 생성합니다.",
#     response={201: ProjectCreateOut, 500: dict},
# )
# async def create_project(request):
#     factory_id = request.GET.get("factory_id")
#     if not factory_id:
#         raise HttpError(400, "factory_id를 입력해야 합니다.")

#     user = request.auth
#     await is_factory_member(int(factory_id), user)

#     try:
#         factory = await Factory.objects.aget(id=int(factory_id))
#         new_project = await Project.objects.acreate()

#         new_quotation = await Quotation.objects.acreate(
#             project=new_project,
#             factory=factory,
#             factory_info=FactoryRowOut.from_orm(factory).dict(),
#         )

#         return 201, {"quotation_id": new_quotation.id, "project_id": new_project.id}

#     except Exception as e:
#         raise HttpError(
#             500, "프로젝트 및 견적서 생성 중 내부 서버 오류가 발생했습니다."
#         )


# Archived Project Tab
@router.post(
    "/clone",
    summary="[C] 프로젝트 복제",
    description="완료된 프로젝트를 복제하여 생산 대기 상태로 새 프로젝트를 생성합니다.",
    response={200: ProjectCloneOut, 400: dict, 404: dict, 500: dict},
)
async def clone_project(request, payload: ProjectCloneIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:

        @sync_to_async
        def clone_project_data():
            try:
                original_project = Project.objects.get(id=payload.project_id)
            except Project.DoesNotExist:
                raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

            if original_project.status != Project.ProjectStatus.completed:
                raise HttpError(400, "완료된 프로젝트만 복제할 수 있습니다.")

            new_project = Project.objects.create(
                status=Project.ProjectStatus.pending,
                transact_date=None,
                tax_invoice=None,
            )

            original_quotations = original_project.quotations.all()
            for original_quotation in original_quotations:
                new_quotation = Quotation.objects.create(
                    project=new_project,
                    factory=original_quotation.factory,
                    client=original_quotation.client,
                    due_date=original_quotation.due_date,
                    uploaded_file=original_quotation.uploaded_file,
                )

                original_products = original_quotation.products.all()
                for original_product in original_products:
                    QuotationProduct.objects.create(
                        quotation=new_quotation,
                        product=original_product.product,
                        quantity=original_product.quantity,
                        unit_price=original_product.unit_price,
                        is_delivery=False,
                        delivery_date=None,
                    )

            original_plans = original_project.plans.all()
            for original_plan in original_plans:
                ProjectPlan.objects.create(
                    project=new_project,
                    status=ProjectPlan.ProductionStatus.pending,
                    product=original_plan.product,
                    quantity=original_plan.quantity,
                    equipment=original_plan.equipment,
                    start_date=original_plan.start_date,
                    end_date=original_plan.end_date,
                    avg_production_time=original_plan.avg_production_time,
                )

            original_logs = original_project.logs.filter(type=ProjectLog.LogType.memo)
            for original_log in original_logs:
                ProjectLog.objects.create(
                    project=new_project,
                    type=original_log.type,
                    title=original_log.title,
                    content=original_log.content,
                )

            return new_project.id

        new_project_id = await clone_project_data()
        return 200, ProjectCloneOut(
            project_id=new_project_id, message="프로젝트가 성공적으로 복제되었습니다."
        )

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "프로젝트 복제 중 내부 서버 오류가 발생했습니다.")


@router.post(
    "/manufactured-to-delivery/{project_id}",
    summary="[C] 생산 완료 프로젝트 생산완료 처리",
    description="프로젝트를 생산완료에서 납품으로 처리합니다. 원자재 소모 처리도 함께 합니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict},
)
async def manufactured_to_delivery(request, project_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        project = await Project.objects.aget(id=project_id)

        # 프로젝트 상태 확인
        if project.status != "manufactured":
            raise HttpError(400, "생산 완료 상태의 프로젝트만 납품 처리할 수 있습니다.")

        # 플랜 기준으로 원자재 소모 처리 (quotation_products가 아닌 플랜 연결 기준)
        plans = await sync_to_async(list)(
            ProjectPlan.objects.filter(project_id=project_id)
            .select_related("product__product")
        )
        if not plans:
            raise HttpError(400, "해당 프로젝트에 생산 계획이 없습니다.")

        try:
            # 원자재 소모 처리 + MaterialHistory 생성
            print("🔍 원자재 소모 처리 시작...")
            for plan in plans:
                # 이미 소모 처리된 플랜은 건너뜀
                if getattr(plan, "material_consumed", False):
                    continue

                product_obj = plan.product.product  # QuotationProduct.product
                production_qty = int(plan.quantity or 0) # 원자재 소모처리 기준은 생산수량 (주문수량 아님)
                print(
                    f"🔍 처리 중인 플랜: plan_id={plan.id}, 제품={product_obj.name}, 수량={production_qty}"
                )
                success, message = await process_material_consumption(
                    product_id=product_obj.id,
                    production_quantity=production_qty,
                    factory_id=int(factory_id),
                )
                if not success:
                    print(f"❌ 원자재 소모 실패: {message}")
                    raise HttpError(400, message)

                # 플랜에 소모 처리 플래그 세팅
                plan.material_consumed = True
                await sync_to_async(plan.save)(update_fields=["material_consumed"])
                print(f"✅ 원자재 소모 처리 완료: {message}")

        except HttpError:
            # HttpError는 그대로 재발생
            raise
        except Exception as e:
            # 기타 예외는 500 에러로 변환
            print(f"❌ 원자재 소모 처리 예외 발생: {str(e)}")
            import traceback
            print(f"❌ 원자재 소모 스택 트레이스: {traceback.format_exc()}")
            raise HttpError(500, f"원자재 소모 처리 중 오류가 발생했습니다: {str(e)}")

        # 프로젝트 상태를 납품으로 변경
        project.status = "delivery"
        await project.asave()

        return 200, {
            "message": "생산 완료 프로젝트가 성공적으로 납품 처리되었습니다.",
            "project_id": project_id,
            "status": "delivery",
            "processed_at": timezone.now().isoformat(),
        }

    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    except Exception as e:
        print(f"❌ manufactured_to_delivery API 에러: {str(e)}")
        print(f"❌ 에러 타입: {type(e)}")
        import traceback

        print(f"❌ 스택 트레이스: {traceback.format_exc()}")
        raise HttpError(
            500,
            f"생산 완료 프로젝트 납품 처리 중 내부 서버 오류가 발생했습니다: {str(e)}",
        )


@router.get(
    "/{project_id}",
    summary="[C] 프로젝트 상태 조회",
    description="프로젝트 ID로 프로젝트 상태를 조회합니다.",
    response=ProjectStatusDetailOut,
    auth=jwt_auth,
)
async def get_project_status(request, project_id: int):

    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    # 프로젝트가 해당 공장에 속하는지 확인
    project = await get_project_by_id(project_id)

    # 프로젝트의 견적서가 해당 공장에 속하는지 확인
    quotation_exists = await project.quotations.filter(
        factory_id=int(factory_id)
    ).aexists()
    if not quotation_exists:
        raise HttpError(404, "해당 프로젝트의 견적서를 찾을 수 없습니다.")

    # 필요한 계산된 필드들을 추가
    @sync_to_async
    def get_project_details():
        # 첫 번째 견적서 ID 가져오기
        first_quotation = project.quotations.first()
        quotation_id = first_quotation.id if first_quotation else None

        # 가장 빠른 시작 날짜와 가장 늦은 끝 날짜 계산
        plans = list(project.plans.all())
        earliest_start_date = min((plan.start_date for plan in plans), default=None)
        latest_end_date = max((plan.end_date for plan in plans), default=None)

        # 납기일 계산 (첫 번째 견적서의 납기일)
        due_date = first_quotation.due_date if first_quotation else None

        return earliest_start_date, latest_end_date, due_date

    earliest_start_date, latest_end_date, due_date = await get_project_details()
    project.earliest_start_date = earliest_start_date
    project.latest_end_date = latest_end_date
    project.due_date = due_date
    return project


@router.get(
    "",
    summary="[C] 진행, 보관된 프로젝트 조회",
    description="진행 또는 보관 중인 프로젝트를 조회, 검색합니다.",
    response={200: List[ListProgressProjectOut], 400: dict, 500: dict},
)
@paginate
async def list_project(
    request,
    filters: ProjectListFilter = Query(...),
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        if not factory_id:
            raise HttpError(400, "factory_id는 필수입니다.")
        now = date.today()
        two_months_ago = now - timedelta(days=60)

        @sync_to_async
        def get_projects():
            # 공장과 연결된 프로젝트들을 먼저 가져옴
            factory_projects = Project.objects.filter(
                quotations__factory_id=int(factory_id)
            )
            factory_project_ids = list(factory_projects.values_list("pk", flat=True))

            # 2개월간 생산계획이 없는 프로젝트를 자동으로 중단 상태로 변경
            projects_to_suspend = factory_projects.annotate(
                has_plan=Exists(ProjectPlan.objects.filter(project=OuterRef("pk")))
            ).filter(
                status__in=["quotation", "confirmed", "pending", "production"],
                has_plan=False,
                updated_at__lte=two_months_ago,
            )

            # 자동으로 중단 상태로 변경
            for project in projects_to_suspend:
                project.status = "suspended"
                project.save()

            # 중단 프로젝트 판별: 견적 협의중 + 2개월간 ProjectPlan 없음 (updated_at 기준)
            abandoned_qs = factory_projects.annotate(
                has_plan=Exists(ProjectPlan.objects.filter(project=OuterRef("pk")))
            ).filter(
                status="quotation",
                has_plan=False,
                updated_at__lte=two_months_ago,
            )
            abandoned_ids = list(abandoned_qs.values_list("pk", flat=True))

            # 상태별 분기
            if filters.status.value == "progress":
                # 완료/중단 제외
                base_qs = factory_projects.exclude(status="completed")
                base_qs = base_qs.exclude(
                    status="suspended"
                )  # 자동 중단된 프로젝트도 제외
                if abandoned_ids:
                    base_qs = base_qs.exclude(pk__in=abandoned_ids)
            elif filters.status.value == "archived":
                # 완료 + 중단 + abandoned
                completed_qs = factory_projects.filter(status="completed")
                suspended_qs = factory_projects.filter(status="suspended")
                abandoned_qs = (
                    Project.objects.filter(pk__in=abandoned_ids)
                    if abandoned_ids
                    else Project.objects.none()
                )
                # union 연산을 위해 QuerySet을 합침
                project_ids = list(completed_qs.values_list("pk", flat=True))
                project_ids.extend(list(suspended_qs.values_list("pk", flat=True)))
                if abandoned_ids:
                    project_ids.extend(abandoned_ids)
                base_qs = Project.objects.filter(pk__in=project_ids)
            elif filters.status.value == "completed":
                base_qs = factory_projects.filter(status="completed")
            elif filters.status.value == "suspended":
                # 중단: status가 "suspended"이거나 abandoned_ids에 해당하는 프로젝트만
                suspended_qs = factory_projects.filter(status="suspended")
                abandoned_qs = (
                    Project.objects.filter(pk__in=abandoned_ids)
                    if abandoned_ids
                    else Project.objects.none()
                )
                project_ids = list(suspended_qs.values_list("pk", flat=True))
                if abandoned_ids:
                    project_ids.extend(abandoned_ids)
                base_qs = Project.objects.filter(pk__in=project_ids)
            else:
                # 개별 상태별 직접 필터링
                base_qs = factory_projects.filter(status=filters.status.value)
                if abandoned_ids:
                    base_qs = base_qs.exclude(pk__in=abandoned_ids)

            if filters.search:
                qs1 = base_qs.filter(quotations__client__name__icontains=filters.search)
                qs2 = base_qs.filter(
                    quotations__products__product__name__icontains=filters.search
                )
                base_qs = qs1.union(qs2)

            project_ids = list(base_qs.values_list("pk", flat=True))

            projects = (
                Project.objects.filter(pk__in=project_ids)
                .prefetch_related(
                    "quotations__client",
                    "quotations__products__product",
                    "plans__product__product",
                    "tax_invoice",
                )
                .distinct()
            )
            return list(projects), abandoned_ids

        projects, abandoned_ids = await get_projects()

        @sync_to_async
        def process_projects():
            result = []
            for project in projects:
                quotations = project.quotations.filter(
                    factory_id=int(factory_id)
                ).prefetch_related("client", "products__product")
                for quotation in quotations:
                    product_names = []
                    for quotation_product in quotation.products.all():
                        product_names.append(quotation_product.product.name)
                    start_date = None
                    plans = project.plans.all()
                    if plans:
                        start_dates = [plan.start_date for plan in plans]
                        start_date = (
                            min(start_dates).date() if min(start_dates) else None
                        )
                    publish_status = None
                    if project.tax_invoice:
                        publish_status = project.tax_invoice.publish_status
                    is_abandoned = False
                    if filters.status.value in ["archived", "suspended"]:
                        is_abandoned = (
                            project.pk in abandoned_ids or project.status == "suspended"
                        )
                    result.append(
                        ListProgressProjectOut(
                            project_id=project.id,
                            quotation_id=quotation.id,
                            client_name=(
                                quotation.client.name if quotation.client else ""
                            ),
                            product_names=product_names,
                            start_date=start_date,
                            due_date=quotation.due_date,
                            publish_status=publish_status,
                            status=project.status,
                            is_abandoned=is_abandoned,
                            created_at=(
                                project.created_at.isoformat()
                                if project.created_at
                                else ""
                            ),
                        )
                    )
            order_field = (
                filters.order_by
                if filters.order_by in ["start_date", "due_date"]
                else "start_date"
            )
            reverse = filters.order_dir == "desc"

            def get_sort_key(item):
                value = getattr(item, order_field)
                if value is None:
                    return date.min
                return value

            result.sort(key=get_sort_key, reverse=reverse)
            return result

        result = await process_projects()
        return result
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "프로젝트 조회 중 내부 서버 오류가 발생했습니다.")


@router.patch(
    "/{project_id}/status",
    summary="[C] 프로젝트 상태 업데이트",
    description="프로젝트의 상태를 업데이트합니다.",
    response={200: ProjectDetailOut, 400: dict, 404: dict, 500: dict},
)
async def update_project_status(
    request, project_id: int, payload: ProjectStatusUpdateIn
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    status_mapping = {
        "quotation": "견적 협의중",
        "confirmed": "주문 확정",
        "pending": "생산 대기",
        "production": "생산 중",
        "manufactured": "생산 완료",
        "delivery": "납품",
        "completed": "프로젝트 완료",
        "suspended": "중단",
    }

    valid_english_statuses = list(status_mapping.keys())

    if payload.status not in status_mapping:
        raise HttpError(
            400,
            f"잘못된 상태값입니다. 다음 중 하나를 입력해주세요: {', '.join(valid_english_statuses)}",
        )

    try:
        project = await Project.objects.aget(id=project_id)

        project.status = payload.status
        if payload.status == "pending":
            project.confirmed_at = timezone.now().date()
        if payload.is_printed is True:
            project.printed_at = timezone.now().date()
        await project.asave()

        # 프로젝트 완료 처리
        if payload.status == "completed":

            @sync_to_async
            def handle_project_completion(project_id):
                from project.models import ProjectPlan
                from stock.models import ProductHistory
                from document.models import Quotation

                # 해당 프로젝트의 모든 생산 계획 조회
                project_plans = list(
                    ProjectPlan.objects.filter(project_id=project_id)
                )

                # 제품별로 계획을 그룹화하여 같은 품목당 단 한 번만 이력 생성
                product_id_to_context = {}
                for plan in project_plans:
                    quotation_product = plan.product
                    product_obj = quotation_product.product
                    if product_obj.id not in product_id_to_context:
                        product_id_to_context[product_obj.id] = {
                            "product": product_obj,
                            "quotation_product": quotation_product,
                            "plans": [],
                        }
                    product_id_to_context[product_obj.id]["plans"].append(plan)

                # 각 제품 그룹 처리
                for product_id, ctx in product_id_to_context.items():
                    product_obj = ctx["product"]
                    quotation_product = ctx["quotation_product"]
                    plans = ctx["plans"]

                    # 모든 계획 완료 처리 (원자재 소모 기록은 manufactured-to-delivery 단계에서 수행)
                    total_production_qty = 0
                    for plan in plans:
                        if plan.status != ProjectPlan.ProductionStatus.completed:
                            plan.status = ProjectPlan.ProductionStatus.completed
                            plan.save()

                        total_production_qty += int(plan.quantity or 0)

                    # QuotationProduct의 납품 상태를 True로 설정
                    if not quotation_product.is_delivery:
                        quotation_product.is_delivery = True
                        quotation_product.save(update_fields=["is_delivery"]) 

                    # --------
                    # product history 생성    
                    # --------

                    # ProductHistory 단 한 건만 생성 (집계값 사용)
                    production_qty = total_production_qty
                    delivery_qty = int(quotation_product.quantity or 0)

                    # 기존 최신 이력과 동일하면 스킵, 다르면 이전 이력 취소
                    latest_prev = (
                        ProductHistory.objects.filter(
                            product=product_obj, project_id=project_id, is_canceled=False
                        )
                        .order_by("-created_at")
                        .first()
                    )
                    canceled_sum = 0
                    if latest_prev:
                        prev_prod = int(latest_prev.production_quantity or 0)
                        prev_delv = int(latest_prev.delivery_quantity or 0)
                        if prev_prod == int(production_qty) and prev_delv == int(delivery_qty):
                            # 동일하면 새 이력 불필요
                            continue
                         # 값이 다르면 직전 이력 취소 처리하고 수량 반영
                        canceled_sum = int(latest_prev.quantity or 0)
                        latest_prev.is_canceled = True
                        latest_prev.save(update_fields=["is_canceled"])
                    # 취소된 이력 수량의 효과를 반대로 적용 (양수면 빼고, 음수면 더함)
                    # 새 이력의 변화량 = 생산 - 납품 - 취소한 과거이력수량
                    delta_qty = int(production_qty) - int(delivery_qty) - int(canceled_sum)

                    # 표시용 거래처명: 견적서 client_info.name 우선, 없으면 null
                    client_name_value = None
                    try:
                        quotation = Quotation.objects.get(id=quotation_product.quotation_id)
                        if quotation.client_info and isinstance(quotation.client_info, dict):
                            client_name_value = quotation.client_info.get("name") or None
                    except Exception:
                        client_name_value = None

                    # 총 재고 (이력 반영 후)
                    new_total_stock = (product_obj.current_stock or 0) + delta_qty

                    # ProductHistory 생성
                    ProductHistory.objects.create(
                        product=product_obj,
                        project_id=project_id,
                        client_name=client_name_value,
                        production_quantity=int(production_qty) or 0,
                        delivery_quantity=int(delivery_qty) or 0,
                        quantity=delta_qty,
                        total_stock=new_total_stock,
                        is_canceled=False,
                    )

                    # ProductHistory 최대 50개 유지
                    keep_ids = list(
                        ProductHistory.objects.filter(product=product_obj)
                        .order_by("-created_at")
                        .values_list("id", flat=True)[:50]
                    )
                    if keep_ids:
                        ProductHistory.objects.filter(product=product_obj).exclude(
                            id__in=keep_ids
                        ).delete()

                    # 품목 현재 재고 업데이트
                    product_obj.current_stock = new_total_stock
                    product_obj.save(update_fields=["current_stock"])

            await handle_project_completion(project.id)

        return 200, ProjectDetailOut(
            id=project.id,
            status=project.status,
            transact_date=project.transact_date,
            tax_invoice=project.tax_invoice.id if project.tax_invoice else None,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )

    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    except Exception as e:
        raise HttpError(500, "프로젝트 상태 업데이트 중 내부 서버 오류가 발생했습니다.")


@router.patch(
    "/{project_id}/transact-date",
    summary="[C] 거래명세서 발급일 업데이트",
    description="프로젝트의 거래명세서 발급일을 업데이트합니다.",
    response={200: ProjectDetailOut, 404: dict, 500: dict},
)
async def update_project_transact_date(
    request, project_id: int, payload: ProjectTransactDateUpdateIn
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        project = await Project.objects.aget(id=project_id)
        project.transact_date = payload.transact_date
        await project.asave()

        return 200, ProjectDetailOut(
            id=project.id,
            status=project.status,
            transact_date=project.transact_date,
            tax_invoice=project.tax_invoice.id if project.tax_invoice else None,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )

    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    except Exception as e:
        raise HttpError(
            500, "거래명세서 발급일 업데이트 중 내부 서버 오류가 발생했습니다."
        )


# Project Tab
@router.delete(
    "/{project_id}",
    summary="[C] 프로젝트 삭제",
    description="프로젝트를 삭제합니다.",
    response={200: ProjectUpdateOut, 404: dict, 500: dict},
)
async def delete_project(request, project_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        project = await Project.objects.aget(id=project_id)
        await project.adelete()

        return 200, {"message": "프로젝트가 성공적으로 삭제되었습니다."}

    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    except Exception as e:
        raise HttpError(500, "프로젝트 삭제 중 내부 서버 오류가 발생했습니다.")
