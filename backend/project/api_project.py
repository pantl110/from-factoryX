from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from django.db.models import Exists, OuterRef
from asgiref.sync import sync_to_async
from datetime import date, timedelta, datetime
from api.permissions import require_factory_access
from api.pagination import PartnerPageNumberPagination
from api.security import api_key_auth, jwt_auth
from api.throttling import PartnerApiKeyThrottle
from typing import List
from django.conf import settings

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
from factory.models import Factory, FactoryClient
from factory.schemas.outbound import FactoryRowOut, FactoryClientRowOut
from document.models import Quotation, QuotationProduct
from project.models import ProjectPlan, ProjectLog
from project.utils import get_project_by_id, update_product_avg_production_time_from_recent_plans
from scheduling.api import update_work_instruction_for_factory

router = Router(tags=["Project"], auth=jwt_auth)


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

        # payload에서 due_date 추출 (async 함수에서)
        due_date_value = payload.due_date if payload.due_date else None
        
        @sync_to_async
        def clone_project_data(due_date):
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
                confirmed_at=date.today(),
            )

            # 원본 quotation_product와 새 quotation_product 매핑
            quotation_product_mapping = {}  # {original_quotation_product_id: new_quotation_product}
            
            original_quotations = original_project.quotations.all()
            for original_quotation in original_quotations:
                # 반납이 아닌 quotation_product만 필터링
                non_refund_products = []
                for original_product in original_quotation.products.all():
                    # 해당 quotation_product를 사용하는 plan 중 refund가 없는 것만 포함
                    has_refund = ProjectPlan.objects.filter(
                        product=original_product,
                        project=original_project
                    ).filter(refunds__isnull=False).exists()
                    
                    if not has_refund:
                        non_refund_products.append(original_product)
                
                if not non_refund_products:
                    continue
                
                # factory와 client 객체 조회하여 정보 가져오기
                factory_info_dict = {}
                if original_quotation.factory_id:
                    try:
                        factory_obj = Factory.objects.get(id=original_quotation.factory_id)
                        factory_info_dict = FactoryRowOut.from_orm(factory_obj).dict()
                    except Factory.DoesNotExist:
                        factory_info_dict = {}
                
                client_info_dict = {}
                if original_quotation.client_id:
                    try:
                        client_obj = FactoryClient.objects.get(id=original_quotation.client_id)
                        client_info_dict = FactoryClientRowOut.from_orm(client_obj).dict()
                    except FactoryClient.DoesNotExist:
                        client_info_dict = {}
                
                # client와 factory는 id로 설정, client_info와 factory_info는 전체 정보로 설정
                new_quotation = Quotation.objects.create(
                    project=new_project,
                    factory_id=original_quotation.factory_id,
                    client_id=original_quotation.client_id,
                    due_date=due_date,  # payload에서 받은 납기일 사용
                    uploaded_file=None,
                    factory_info=factory_info_dict,
                    client_info=client_info_dict,
                )

                # 반납이 아닌 quotation_product만 생성
                for original_product in non_refund_products:
                    new_quotation_product = QuotationProduct.objects.create(
                        quotation=new_quotation,
                        product=original_product.product,
                        quantity=original_product.quantity,
                        unit_price=original_product.unit_price,
                        is_delivery=False,
                        delivery_date=None,
                    )
                    # 원본 quotation_product와 새 quotation_product 매핑 저장
                    quotation_product_mapping[original_product.id] = new_quotation_product

            # products_info 생성: 반납이 아닌 quotation_product만 포함
            products_info = []
            for original_quotation in original_quotations:
                for original_product in original_quotation.products.all():
                    # 해당 quotation_product를 사용하는 plan 중 refund가 없는 것만 포함
                    has_refund = ProjectPlan.objects.filter(
                        product=original_product,
                        project=original_project
                    ).filter(refunds__isnull=False).exists()
                    
                    if not has_refund:
                        new_quotation_product = quotation_product_mapping.get(original_product.id)
                        if new_quotation_product:
                            product_info = {
                                "id": new_quotation_product.product.id,
                                "name": new_quotation_product.product.name,
                                "code": new_quotation_product.product.code,
                                "spec": new_quotation_product.product.spec,
                                "unit": new_quotation_product.product.unit,
                                "quantity": new_quotation_product.quantity,
                                "unit_price": new_quotation_product.unit_price,
                                "total_price": new_quotation_product.quantity * new_quotation_product.unit_price,
                                "quotation_product_id": new_quotation_product.id,
                                "created_at": date.today().isoformat(),
                                "delivery_date": None,
                            }
                            products_info.append(product_info)
            
            # products_info를 첫 번째 quotation에 저장
            if original_quotations.exists() and products_info:
                first_quotation = new_project.quotations.first()
                first_quotation.products_info = products_info
                first_quotation.save()

            original_logs = original_project.logs.filter(type=ProjectLog.LogType.memo)
            for original_log in original_logs:
                ProjectLog.objects.create(
                    project=new_project,
                    type=original_log.type,
                    title=original_log.title,
                    content=original_log.content,
                )

            # quotation_product_mapping을 ID 기반으로 변환
            quotation_product_id_mapping = {
                orig_id: new_qp.id 
                for orig_id, new_qp in quotation_product_mapping.items()
            }
            
            return new_project.id, quotation_product_id_mapping, int(factory_id)

        new_project_id, quotation_product_id_mapping, factory_id_value = await clone_project_data(due_date_value)
        
        # Plan 생성: recommend_equipment_and_create_plan 사용
        async def create_plans():
            from project.utils import recommend_equipment_and_create_plan
            
            new_project = await Project.objects.aget(id=new_project_id)
            original_project = await Project.objects.aget(id=payload.project_id)
            
            # 이번 배치에서 생성한 임시 ProjectPlan들을 설비별로 모아두기
            temp_plans_by_equipment = {}
            
            # 원본 프로젝트의 plan들을 순회하면서 반납이 아닌 것만 처리
            original_plans = await sync_to_async(list)(
                ProjectPlan.objects.filter(project=original_project)
                .select_related("product__product")
            )
            
            for original_plan in original_plans:
                # refund가 아닌 plan만 처리
                has_refund = await sync_to_async(original_plan.refunds.exists)()
                if has_refund:
                    continue
                
                original_quotation_product = original_plan.product
                new_quotation_product_id = quotation_product_id_mapping.get(original_quotation_product.id)
                
                if not new_quotation_product_id:
                    continue
                
                # 새 quotation_product 조회
                new_quotation_product = await QuotationProduct.objects.select_related("product").aget(id=new_quotation_product_id)
                
                # 제품 정보 가져오기 (생산 시간 계산을 위해 필요)
                product = new_quotation_product.product
                buffer_rate = float(product.buffer_rate) if product.buffer_rate else 0.0
                base_quantity = new_quotation_product.quantity  # 주문수량
                production_quantity = int(base_quantity * (1 + buffer_rate))  # 생산수량
                avg_production_time = product.average_production_time or 30  # 기본값 30초
                
                try:
                    # 설비 추천 + 생산 계획 생성까지 한 번에 처리
                    project_plan, equipment = await recommend_equipment_and_create_plan(
                        project=new_project,
                        quotation_product=new_quotation_product,
                        factory_id=factory_id_value,
                        quantity=production_quantity,
                        product_avg_production_time=avg_production_time,
                        status=ProjectPlan.ProductionStatus.pending,
                        additional_plans_by_equipment=temp_plans_by_equipment,
                        save=True,
                    )
                except Exception as e:
                    # 설비 추천 실패 시 에러 발생
                    raise HttpError(400, f"설비 조회 중 오류가 발생했습니다: {str(e)}")
        
        await create_plans()
        
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
    description="프로젝트를 생산완료에서 납품으로 처리합니다. 원자재 소모 처리도 함께 합니다(소모 처리는 현재 비활성화, 필요 시 주석 처리하여 활성화).",
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

        # NOTE: 생산 완료 → 납품 전환 시 원자재 소모 처리 및 MaterialHistory 생성 로직
        # v2에서는 material usage api를 사용하여 원자재 소모 처리를 합니다. 필요 시 아래 주석 블록을
        # 해제하여 기존 동작을 복구할 수 있습니다.
        # try:
        #     print("🔍 원자재 소모 처리 시작...")
        #     for plan in plans:
        #         # 이미 소모 처리된 플랜은 건너뜀
        #         if getattr(plan, "material_consumed", False):
        #             continue
        #
        #         product_obj = plan.product.product  # QuotationProduct.product
        #         production_qty = int(plan.quantity or 0) # 원자재 소모처리 기준은 생산수량 (주문수량 아님)
        #         print(
        #             f"🔍 처리 중인 플랜: plan_id={plan.id}, 제품={product_obj.name}, 수량={production_qty}"
        #         )
        #         success, message = await process_material_consumption(
        #             product_id=product_obj.id,
        #             production_quantity=production_qty,
        #             factory_id=int(factory_id),
        #         )
        #         if not success:
        #             print(f"❌ 원자재 소모 실패: {message}")
        #             raise HttpError(400, message)
        #
        #         # 플랜에 소모 처리 플래그 세팅
        #         plan.material_consumed = True
        #         await sync_to_async(plan.save)(update_fields=["material_consumed"])
        #         print(f"✅ 원자재 소모 처리 완료: {message}")
        #
        # except HttpError:
        #     # HttpError는 그대로 재발생
        #     raise
        # except Exception as e:
        #     # 기타 예외는 500 에러로 변환
        #     print(f"❌ 원자재 소모 처리 예외 발생: {str(e)}")
        #     import traceback
        #     print(f"❌ 원자재 소모 스택 트레이스: {traceback.format_exc()}")
        #     raise HttpError(500, f"원자재 소모 처리 중 오류가 발생했습니다: {str(e)}")

        # 프로젝트 상태를 납품으로 변경
        project.status = "delivery"
        await project.asave()

        return 200, {
            "message": "생산 완료 프로젝트가 성공적으로 납품 처리되었습니다.",
            "project_id": project_id,
            "status": "delivery",
            "processed_at": datetime.now().isoformat(),
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
    auth=[jwt_auth, api_key_auth],
    throttle=[PartnerApiKeyThrottle()],
    response={200: List[ListProgressProjectOut], 400: dict, 500: dict},
)
@paginate(PartnerPageNumberPagination)
async def list_project(
    request,
    filters: ProjectListFilter = Query(...),
    factory_id: int = Query(...),
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await require_factory_access(int(factory_id), user)

    try:
        if not factory_id:
            raise HttpError(400, "factory_id는 필수입니다.")
        now = date.today()
        two_months_ago = now - timedelta(days=60)

        @sync_to_async
        def get_projects():
            status = filters.status

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
            if status == "progress":
                # 완료/중단 제외
                base_qs = factory_projects.exclude(status="completed")
                base_qs = base_qs.exclude(
                    status="suspended"
                )  # 자동 중단된 프로젝트도 제외
                if abandoned_ids:
                    base_qs = base_qs.exclude(pk__in=abandoned_ids)
            elif status == "archived":
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
            elif status == "completed":
                base_qs = factory_projects.filter(status="completed")
            elif status == "suspended":
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
            elif status:
                # 개별 상태별 직접 필터링
                base_qs = factory_projects.filter(status=status)
                if abandoned_ids:
                    base_qs = base_qs.exclude(pk__in=abandoned_ids)
            else:
                base_qs = factory_projects

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
                    if filters.status in ["archived", "suspended"]:
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

        # 이전 상태 저장
        old_status = project.status

        project.status = payload.status
        if payload.status == Project.ProjectStatus.pending:
            project.pending_at = date.today()
        if (
            payload.status == Project.ProjectStatus.completed
            and old_status != Project.ProjectStatus.completed
        ):
            project.completed_at = date.today()
        if payload.is_printed is True:
            project.printed_at = date.today()
        await project.asave()

        # 프로젝트 상태가 "생산 대기" → "생산 중"으로 변경되면 WorkInstruction 갱신
        if old_status == Project.ProjectStatus.pending and payload.status == Project.ProjectStatus.production:
            @sync_to_async
            def update_work_instructions_for_project():
                today = date.today()
                
                # 이 프로젝트의 오늘 시작하는 Plan들의 factory_id 조회
                factory_ids = set(
                    ProjectPlan.objects.filter(
                        project_id=project_id,
                        start_date__date=today
                    ).values_list('equipment__factory_id', flat=True)
                )
                
                # 각 factory의 WorkInstruction 갱신
                for factory_id in factory_ids:
                    if factory_id:
                        update_work_instruction_for_factory(factory_id)
            
            await update_work_instructions_for_project()

        # 프로젝트 완료 처리
        if payload.status == Project.ProjectStatus.completed:

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

                    # 프로젝트 완료 시점에는 이미 모든 계획이 완료된 상태이므로
                    # 계획 완료 처리 로직은 불필요 (production → manufactured 전환 시 이미 완료됨)
                    # 하지만 테스트나 특수한 경우를 위해 주석처리로 유지
                    total_production_qty = 0
                    # has_new_completed = False
                    for plan in plans:
                        # if plan.status != ProjectPlan.ProductionStatus.completed:
                        #     plan.status = ProjectPlan.ProductionStatus.completed
                        #     plan.save()
                        #     has_new_completed = True

                        total_production_qty += int(plan.quantity or 0)
                    
                    # 새로 완료된 계획이 있으면 최근 50개 완료 계획 기반으로 제품 평균 시간 업데이트
                    # if has_new_completed:
                    #     # handle_project_completion은 @sync_to_async로 감싸져 있으므로, 
                    #     # 동기 함수를 직접 호출
                    #     update_product_avg_production_time_from_recent_plans(product_obj.id)

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
