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
)
from project.schemas.outbound import (
    ProjectCreateOut,
    ListProgressProjectOut,
    ProjectDetailOut,
    ProjectUpdateOut,
    ProjectStatusOut,
    ProjectCloneOut,
)
from document.models import Quotation
from factory.models import Factory
from factory.utils import is_factory_member
from document.models import Quotation, QuotationProduct
from project.models import ProjectPlan, ProjectLog


router = Router(tags=["Project"], auth=jwt_auth)


# Project Tab
@router.post(
    "",
    summary="[C] 프로젝트 생성",
    description="프로젝트와 견적서를 동시에 생성합니다.",
    response={201: ProjectCreateOut, 500: dict},
)
async def create_project(request):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory = await Factory.objects.aget(id=int(factory_id))
        new_project = await Project.objects.acreate()

        new_quotation = await Quotation.objects.acreate(
            project=new_project, factory=factory
        )

        return 201, {"quotation_id": new_quotation.id, "project_id": new_project.id}

    except Exception as e:
        raise HttpError(
            500, "프로젝트 및 견적서 생성 중 내부 서버 오류가 발생했습니다."
        )


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


@router.get(
    "/{project_id}",
    summary="[C] 프로젝트 상태 조회",
    description="프로젝트 ID로 프로젝트 상태를 조회합니다.",
    response={200: ProjectStatusOut, 404: dict, 403: dict, 500: dict},
    auth=jwt_auth,
)
async def get_project_status(request, project_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        # 프로젝트가 해당 공장에 속하는지 확인
        project = await sync_to_async(Project.objects.get)(id=project_id)

        # 프로젝트의 견적서가 해당 공장에 속하는지 확인
        quotation_exists = await sync_to_async(
            project.quotations.filter(factory_id=int(factory_id)).exists
        )()
        if not quotation_exists:
            raise Project.DoesNotExist

        # 프로젝트 플랜에서 가장 빠른 생산일자와 가장 늦은 마감일자 조회
        @sync_to_async
        def get_project_dates():
            plans = project.plans.all()
            earliest_start_date = None
            latest_end_date = None

            if plans:
                start_dates = [plan.start_date for plan in plans]
                end_dates = [plan.end_date for plan in plans]
                earliest_start_date = min(start_dates) if start_dates else None
                latest_end_date = max(end_dates) if end_dates else None

            return earliest_start_date, latest_end_date

        # 견적서의 납기일자와 ID 조회
        @sync_to_async
        def get_quotation_info():
            quotation = project.quotations.filter(factory_id=int(factory_id)).first()
            return quotation.due_date if quotation else None, (
                quotation.id if quotation else None
            )

        earliest_start_date, latest_end_date = await get_project_dates()
        due_date, quotation_id = await get_quotation_info()

        return ProjectStatusOut(
            project_id=project.id,
            quotation_id=quotation_id,
            status=project.status,
            is_refunded=project.is_refunded,
            created_at=project.created_at,
            updated_at=project.updated_at,
            earliest_start_date=earliest_start_date,
            latest_end_date=latest_end_date,
            due_date=due_date,
        )

    except Project.DoesNotExist:
        raise HttpError(404, "프로젝트를 찾을 수 없습니다.")
    except Exception as e:
        raise HttpError(
            500, f"프로젝트 상태 조회 중 내부 서버 오류가 발생했습니다: {str(e)}"
        )


@router.get(
    "",
    summary="[C] 진행, 보관된 프로젝트 조회",
    description="진행 또는 보관 중인 프로젝트를 조회, 검색합니다.",
    response={200: List[ListProgressProjectOut], 400: dict, 500: dict},
)
@paginate
async def list_project(
    request,
    status: str = Query(...),
    search: str = Query(None),
    order_by: str = Query("start_date"),
    order_dir: str = Query("asc"),
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        valid_statuses = [
            "progress",
            "archived",
            "complete",
            "suspended",
            "quotation",
            "confirmed",
            "pending",
            "production",
            "manufactured",
            "delivery",
        ]
        if status not in valid_statuses:
            raise HttpError(400, f"status는 {valid_statuses} 중 하나여야 합니다.")
        if not factory_id:
            raise HttpError(400, "factory_id는 필수입니다.")
        now = date.today()
        two_months_ago = now - timedelta(days=60)

        @sync_to_async
        def get_projects():
            base_qs = Project.objects.filter(quotations__factory_id=int(factory_id))

            # 2개월간 생산계획이 없는 프로젝트를 자동으로 중단 상태로 변경
            projects_to_suspend = base_qs.annotate(
                has_plan=Exists(ProjectPlan.objects.filter(project=OuterRef("pk")))
            ).filter(
                status__in=["견적 협의중", "주문 확정", "생산 대기", "생산 중"],
                has_plan=False,
                updated_at__lte=two_months_ago,
            )

            # 자동으로 중단 상태로 변경
            for project in projects_to_suspend:
                project.status = "중단"
                project.save()

            # 중단 프로젝트 판별: 견적 협의중 + 2개월간 ProjectPlan 없음 (updated_at 기준)
            abandoned_qs = base_qs.annotate(
                has_plan=Exists(ProjectPlan.objects.filter(project=OuterRef("pk")))
            ).filter(
                status="견적 협의중",
                has_plan=False,
                updated_at__lte=two_months_ago,
            )
            abandoned_ids = list(abandoned_qs.values_list("pk", flat=True))

            # 상태별 분기
            if status == "progress":
                # 완료/중단 제외
                base_qs = base_qs.exclude(status="프로젝트 완료")
                base_qs = base_qs.exclude(status="중단")  # 자동 중단된 프로젝트도 제외
                if abandoned_ids:
                    base_qs = base_qs.exclude(pk__in=abandoned_ids)
            elif status == "archived":
                # 완료 + 중단 + abandoned
                completed_qs = base_qs.filter(status="프로젝트 완료")
                suspended_qs = base_qs.filter(status="중단")
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
            elif status == "complete":
                base_qs = base_qs.filter(status="프로젝트 완료")
            elif status == "suspended":
                # 중단: status가 "중단"이거나 abandoned_ids에 해당하는 프로젝트만
                suspended_qs = base_qs.filter(status="중단")
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
                # 개별 상태별 매핑 (한글 값으로 필터링)
                status_mapping = {
                    "quotation": "견적 협의중",
                    "confirmed": "주문 확정",
                    "pending": "생산 대기",
                    "production": "생산 중",
                    "manufactured": "생산 완료",
                    "delivery": "납품",
                }
                if status in status_mapping:
                    base_qs = base_qs.filter(status=status_mapping[status])
                    if abandoned_ids:
                        base_qs = base_qs.exclude(pk__in=abandoned_ids)
                else:
                    base_qs = Project.objects.none()

            if search:
                qs1 = base_qs.filter(quotations__client__name__icontains=search)
                qs2 = base_qs.filter(
                    quotations__products__product__name__icontains=search
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
                        start_date = min(start_dates)
                    publish_status = None
                    if project.tax_invoice:
                        publish_status = project.tax_invoice.publish_status
                    is_abandoned = False
                    if status in ["archived", "suspended"]:
                        is_abandoned = (
                            project.pk in abandoned_ids or project.status == "중단"
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
                        )
                    )
            order_field = (
                order_by if order_by in ["start_date", "due_date"] else "start_date"
            )
            reverse = order_dir == "desc"

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

        project.status = status_mapping[payload.status]
        await project.asave()

        # 프로젝트 완료 처리
        if payload.status == "completed":

            @sync_to_async
            def handle_project_completion(project_id, factory_id):
                from project.models import ProjectPlan
                from stock.models import MaterialProduct, Material, MaterialHistory

                # 해당 프로젝트의 모든 생산 계획 조회
                project_plans = ProjectPlan.objects.filter(project_id=project_id)

                for plan in project_plans:
                    # 이미 완료된 계획은 건너뛰기
                    if plan.is_completed:
                        continue

                    # 계획을 완료 상태로 변경
                    plan.is_completed = True
                    plan.save()

                    # 해당 제품에 연결된 원자재 조회
                    quotation_product = plan.product
                    material_products = MaterialProduct.objects.filter(
                        product=quotation_product.product
                    )

                    for material_product in material_products:
                        material = material_product.material
                        consumed_quantity = material_product.quantity * plan.quantity

                        # 원자재 히스토리 생성
                        # client는 factory의 기본 고객으로 설정 (임시)
                        from factory.models import FactoryClient

                        default_client = FactoryClient.objects.filter(
                            factory_id=int(factory_id)
                        ).first()
                        if not default_client:
                            # 기본 고객이 없으면 생성
                            default_client = FactoryClient.objects.create(
                                factory_id=int(factory_id),
                                name="기본 고객",
                                type="company",
                            )

                        # 현재 재고 계산
                        current_stock = material.current_stock - consumed_quantity

                        MaterialHistory.objects.create(
                            material=material,
                            type="consumption",
                            client=default_client,
                            quantity=consumed_quantity,
                            total_stock=current_stock,
                        )

            await handle_project_completion(project.id, int(factory_id))

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
