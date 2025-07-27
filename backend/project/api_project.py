from ninja import Router, Query, FilterSchema
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from project.schemas.outbound import (
    ProjectCreateOut,
    ProjectDetailOut,
    ProjectUpdateOut,
    ListProgressProjectOut,
)
from project.schemas.inbound import (
    ProjectStatusUpdateIn,
    ProjectTransactDateUpdateIn,
    ProjectCloneIn,
    ProjectListFilter,
    TestCreateProjectsIn,
)
from project.models import Project, ProjectPlan
from document.models import Quotation
from factory.models import Factory
from datetime import date, timedelta
from typing import List, Optional
from django.db.models import Exists, OuterRef

import random
import string
from factory.models import FactoryClient

router = Router(tags=["Project"], auth=jwt_auth)


@router.post(
    "/test",
    summary="[TEST] 상태별 프로젝트 일괄 생성",
    description="테스트용: factory_id로 모든 상태별 프로젝트+견적서를 생성합니다.",
    response={200: dict},
    auth=None,  # 인증 없이 테스트용으로 사용
)
async def test_create_projects_by_status(request, payload: TestCreateProjectsIn):
    """
    입력 필드:
    - factory_id: 공장 ID (int)
    반환 필드:
    - projects: [{id, status, client_name} ...]
    """
    try:
        factory = await Factory.objects.aget(id=payload.factory_id)
    except Factory.DoesNotExist:
        raise HttpError(404, "공장 정보를 찾을 수 없습니다.")

    created = []
    for status, _ in Project.ProjectStatus.choices:
        # 랜덤 거래처명 생성
        rand_name = "테스트거래처_" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        client = await FactoryClient.objects.acreate(
            factory=factory,
            name=rand_name,
            business_registration_number=''.join(random.choices(string.digits, k=10)),
            representative_name="홍길동",
            type=FactoryClient.ClientType.customer
        )
        project = await Project.objects.acreate(status=status)
        quotation = await Quotation.objects.acreate(project=project, factory=factory, client=client)
        created.append({"id": project.id, "status": status, "client_name": client.name})
    return {"projects": created}


# Project Tab
# 생산 시작 전 임시로 프로젝트에 빈 견적서 생성
@router.post(
    "",
    summary="[C] 프로젝트 생성",
    description="프로젝트와 견적서를 동시에 생성합니다.",
    response={201: ProjectCreateOut, 500: dict},
)
async def create_project(request):
    """
    입력 필드:
    - (body 없음)  # 별도의 입력값 없이 프로젝트와 견적서를 생성

    반환 필드:
    - id: 생성된 견적서(Quotation)의 ID (int)
    """
    try:
        new_project = await Project.objects.acreate()

        new_quotation = await Quotation.objects.acreate(project=new_project)

        return 201, {"id": new_quotation.id}

    except Exception as e:
        raise HttpError(
            500, "프로젝트 및 견적서 생성 중 내부 서버 오류가 발생했습니다."
        )


# Archived Project Tab
@router.post(
    "/clone",
    summary="[C] 프로젝트 복제",
    description="완료된 프로젝트를 복제하여 생산 대기 상태로 새 프로젝트를 생성합니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict},
)
async def clone_project(request, payload: ProjectCloneIn):
    """
    완료된 프로젝트를 복제하여 생산 대기 상태로 새 프로젝트를 생성합니다.

    입력 필드:
    - project_id: 복제할 프로젝트 ID (int)

    반환 필드: 없음 (성공 시 빈 응답)
    """
    try:

        @sync_to_async
        def clone_project_data():
            from document.models import Quotation, QuotationProduct
            from project.models import ProjectPlan, ProjectLog

            # 원본 프로젝트 존재 확인
            try:
                original_project = Project.objects.get(id=payload.project_id)
            except Project.DoesNotExist:
                raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

            # 완료된 프로젝트인지 확인
            if original_project.status != Project.ProjectStatus.completed:
                raise HttpError(400, "완료된 프로젝트만 복제할 수 있습니다.")

            # 새 프로젝트 생성 (생산 대기 상태)
            new_project = Project.objects.create(
                status=Project.ProjectStatus.pending,
                transact_date=None,  # 거래명세서 발행일 초기화
                tax_invoice=None,  # 세금계산서 연결 초기화
            )

            # 견적서 복제
            original_quotations = original_project.quotations.all()
            for original_quotation in original_quotations:
                new_quotation = Quotation.objects.create(
                    project=new_project,
                    factory=original_quotation.factory,
                    client=original_quotation.client,
                    due_date=original_quotation.due_date,
                    uploaded_file=original_quotation.uploaded_file,
                )

                # 견적서 제품 복제
                original_products = original_quotation.products.all()
                for original_product in original_products:
                    QuotationProduct.objects.create(
                        quotation=new_quotation,
                        product=original_product.product,
                        quantity=original_product.quantity,
                        unit_price=original_product.unit_price,
                        is_delivery=False,  # 납품 여부 초기화
                        delivery_date=None,  # 납품 일자 초기화
                    )

            # 생산 계획 복제
            original_plans = original_project.plans.all()
            for original_plan in original_plans:
                ProjectPlan.objects.create(
                    project=new_project,
                    status=ProjectPlan.ProductionStatus.pending,  # 가동 대기로 초기화
                    product=original_plan.product,
                    quantity=original_plan.quantity,
                    equipment=original_plan.equipment,
                    start_date=original_plan.start_date,
                    end_date=original_plan.end_date,
                    avg_production_time=original_plan.avg_production_time,
                )

            # 생산 로그 복제 (메모 타입만)
            original_logs = original_project.logs.filter(type=ProjectLog.LogType.memo)
            for original_log in original_logs:
                ProjectLog.objects.create(
                    project=new_project,
                    type=original_log.type,
                    title=original_log.title,
                    content=original_log.content,
                )

            return {}

        result = await clone_project_data()
        return result

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "프로젝트 복제 중 내부 서버 오류가 발생했습니다.")


@router.get(
    "",
    summary="[C] 진행, 보관된 프로젝트 조회",
    description="진행 또는 보관 중인 프로젝트를 조회, 검색색합니다.",
    response={200: List[ListProgressProjectOut], 400: dict, 500: dict},
)
@paginate
async def list_project(request, filters: ProjectListFilter = Query(...)):
    """
    입력 필드:
    - factory_id: 공장 ID (필수)
    - status: 조회 상태 ("progress", "archived", "complete", "interruption", "quotation", "pending", "production", "manufactured", "delivery")
        - "progress": 전체 진행 중 프로젝트(완료/중단 제외)
        - "archived": 완료 + 중단 프로젝트(보관함)
        - "complete": 완료된 프로젝트만
        - "interruption": 중단된 프로젝트만 (견적 협의중 + 2개월간 ProjectPlan 없음)
        - "quotation", "pending", "production", "manufactured", "delivery": 해당 상태만 조회
    - search: 업체명 또는 품목명(제품명) (선택, 미입력 시 전체)
    - order_by: 정렬 기준 ("start_date" 또는 "due_date", 기본값: "start_date")
    - order_dir: 정렬 방향 ("asc" 또는 "desc", 기본값: "asc")

    반환 필드:
    - project_id: 프로젝트 ID
    - client_name: 고객사명 (Quotation.FactoryClient.name)
    - product_names: 제품명 목록 (Quotation.QuotationProduct.Product.name 배열)
    - start_date: 생산 시작일 (ProjectPlan.start_date 중 가장 빠른 날짜)
    - due_date: 납기일자 (Quotation.due_date)
    - publish_status: 세금계산서 발행 상태 (Project.NationalTaxService.publish_status)
        - null: 세금계산서 미연결 ("연결 필요"로 표시)
        - "temporary": 임시 저장 ("미발행"으로 표시)
        - "pending": 발행 대기 ("미발행"으로 표시)
        - "published": 발행 완료 ("보기"로 표시)
    - status: 프로젝트 상태 (Project.status)
    - is_abandoned: 중단 프로젝트 여부 (archived, interruption에서만 true)

    예시:
    - 전체 진행 중: status="progress"
    - 보관함(완료+중단): status="archived"
    - 완료: status="complete"
    - 중단: status="interruption"
    - 견적 협의중만: status="quotation"
    - 생산 대기만: status="pending"
    - 생산 중만: status="production"
    - 생산 완료만: status="manufactured"
    - 납품만: status="delivery"
    """
    try:
        valid_statuses = [
            "progress",
            "archived",
            "complete",
            "interruption",
            "quotation",
            "pending",
            "production",
            "manufactured",
            "delivery",
        ]
        status = filters.status
        factory_id = filters.factory_id
        if status not in valid_statuses:
            raise HttpError(400, f"status는 {valid_statuses} 중 하나여야 합니다.")
        if not factory_id:
            raise HttpError(400, "factory_id는 필수입니다.")
        now = date.today()
        two_months_ago = now - timedelta(days=60)

        @sync_to_async
        def get_projects():
            base_qs = Project.objects.filter(quotations__factory_id=factory_id)
            # 중단 프로젝트 판별: 견적 협의중 + 2개월간 ProjectPlan 없음 (updated_at 기준)
            abandoned_qs = base_qs.annotate(
                has_plan=Exists(ProjectPlan.objects.filter(project=OuterRef("pk")))
            ).filter(
                status=Project.ProjectStatus.quotation,
                has_plan=False,
                updated_at__lte=two_months_ago,
            )
            abandoned_ids = list(abandoned_qs.values_list("pk", flat=True))

            # 상태별 분기
            if status == "progress":
                # 완료/중단 제외
                base_qs = base_qs.exclude(status=Project.ProjectStatus.completed)
                if abandoned_ids:
                    base_qs = base_qs.exclude(pk__in=abandoned_ids)
            elif status == "archived":
                # 완료 + 중단
                completed_qs = base_qs.filter(status=Project.ProjectStatus.completed)
                abandoned_qs = Project.objects.filter(pk__in=abandoned_ids) if abandoned_ids else Project.objects.none()
                # union 연산을 위해 QuerySet을 합침
                project_ids = list(completed_qs.values_list("pk", flat=True))
                if abandoned_ids:
                    project_ids.extend(abandoned_ids)
                base_qs = Project.objects.filter(pk__in=project_ids)
            elif status == "complete":
                base_qs = base_qs.filter(status=Project.ProjectStatus.completed)
            elif status == "interruption":
                # 중단: abandoned_ids에 해당하는 프로젝트만
                if abandoned_ids:
                    base_qs = Project.objects.filter(pk__in=abandoned_ids)
                else:
                    base_qs = Project.objects.none()
            else:
                # 개별 상태별 매핑
                status_mapping = {
                    "quotation": Project.ProjectStatus.quotation,
                    "pending": Project.ProjectStatus.pending,
                    "production": Project.ProjectStatus.production,
                    "manufactured": Project.ProjectStatus.manufactured,
                    "delivery": Project.ProjectStatus.delivery,
                }
                if status in status_mapping:
                    base_qs = base_qs.filter(status=status_mapping[status])
                    if abandoned_ids:
                        base_qs = base_qs.exclude(pk__in=abandoned_ids)
                else:
                    base_qs = Project.objects.none()

            if filters.search:
                qs1 = base_qs.filter(quotations__client__name__icontains=filters.search)
                qs2 = base_qs.filter(
                    quotations__products__product__name__icontains=filters.search
                )
                base_qs = qs1.union(qs2)

            # union 연산 후에는 prefetch_related를 사용할 수 없으므로, 
            # 먼저 프로젝트 ID 목록을 가져온 후 다시 조회
            project_ids = list(base_qs.values_list("pk", flat=True))
            
            # 프로젝트 ID로 다시 조회하여 prefetch_related 적용
            projects = Project.objects.filter(pk__in=project_ids).prefetch_related(
                "quotations__client",
                "quotations__products__product",
                "plans__product__product",
                "tax_invoice",
            ).distinct()
            return list(projects), abandoned_ids

        projects, abandoned_ids = await get_projects()
        
        @sync_to_async
        def process_projects():
            result = []
            for project in projects:
                quotations = project.quotations.filter(
                    factory_id=factory_id
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
                    if status in ["archived", "interruption"]:
                        is_abandoned = project.pk in abandoned_ids
                    result.append(
                        ListProgressProjectOut(
                            project_id=project.id,
                            client_name=quotation.client.name if quotation.client else "",
                            product_names=product_names,
                            start_date=start_date or quotation.due_date,
                            due_date=quotation.due_date,
                            publish_status=publish_status,
                            status=project.status,
                            is_abandoned=is_abandoned,
                        )
                    )
            order_field = (
                filters.order_by
                if filters.order_by in ["start_date", "due_date"]
                else "start_date"
            )
            reverse = filters.order_dir == "desc"

            def get_sort_key(item):
                return getattr(item, order_field) or date.min

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
    valid_statuses = [choice[0] for choice in Project.ProjectStatus.choices]
    if payload.status not in valid_statuses:
        raise HttpError(400, "올바르지 않은 상태값입니다.")

    try:
        project = await Project.objects.aget(id=project_id)
        project.status = payload.status
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
    try:
        project = await Project.objects.aget(id=project_id)
        await project.adelete()

        return 200, {"message": "프로젝트가 성공적으로 삭제되었습니다."}

    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    except Exception as e:
        raise HttpError(500, "프로젝트 삭제 중 내부 서버 오류가 발생했습니다.")