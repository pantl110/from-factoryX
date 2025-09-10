from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.security import jwt_auth
from asgiref.sync import sync_to_async
from typing import List, Optional
from project.models import Project
from project.schemas.inbound import ProjectFilter
from project.schemas.outbound import ProjectModelOut
from factory.utils import is_factory_member
from django.utils import timezone
from datetime import timedelta
from django.db.models import Min, F

router = Router(
    tags=["Project V2"],
    auth=jwt_auth,
)


@router.get(
    "",
    summary="[C] 진행, 보관된 프로젝트 조회",
    description="진행 또는 보관 중인 프로젝트를 조회, 검색합니다.",
    response=List[ProjectModelOut],
)
@paginate
async def list_projects(
    request,
    filters: ProjectFilter = Query(...),
    order_by: Optional[str] = Query(
        "start_date",
        description="정렬 필드(-start_date, -printed_at, -confirmed_at 등)",
    ),
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)
    now = timezone.now()
    two_months_ago = now - timedelta(days=60)

    @sync_to_async
    def get_projects():
        # 두 단계로 나누어 처리하여 중복 방지
        # 1단계: 기본 프로젝트 쿼리 (중복 없이)
        base_queryset = Project.objects.filter(
            quotations__factory_id=factory_id
        ).distinct()

        # 2단계: 필요한 데이터와 함께 prefetch
        queryset = base_queryset.prefetch_related(
            "quotations__client",
            "quotations__products__product",
            "plans__product__product",
            "tax_invoice",
        ).annotate(
            start_date=Min("plans__start_date"),
            # 첫 번째 견적서의 정보만 사용 (중복 방지)
            due_date=Min("quotations__due_date"),
            client_name=Min("quotations__client__name"),
        )

        queryset = filters.filter(queryset)
        if order_by:
            queryset = queryset.order_by(order_by)
        return list(queryset)

    projects = await get_projects()

    return projects
