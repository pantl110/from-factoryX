from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.security import jwt_auth
from asgiref.sync import sync_to_async
from typing import List, Optional
from datetime import timedelta
from project.models import Project
from project.schemas.inbound import ProjectFilter
from project.schemas.outbound import ProjectModelOut, StaleConfirmedProjectOut
from factory.utils import is_factory_member
from django.db.models import Min
from datetime import date

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
        description="정렬 필드(-start_date, -printed_at, -pending_at 등)",
    ),
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

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
            "tax_invoice__document_group__documents",
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


@router.get(
    "/stale-confirmed",
    summary="[R] 7일 이상 경과한 주문 확정 프로젝트 조회",
    description="confirmed 상태이면서 confirmed_at이 7일 이상 지난 프로젝트 목록을 조회합니다.",
    response={200: List[StaleConfirmedProjectOut], 400: dict, 500: dict},
)
async def list_stale_confirmed_projects(request):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    today = date.today()
    cutoff_date = today - timedelta(days=7)

    try:

        @sync_to_async
        def fetch_projects():
            projects = (
                Project.objects.filter(
                    status=Project.ProjectStatus.confirmed,
                    confirmed_at__isnull=False,
                    confirmed_at__lte=cutoff_date,
                    quotations__factory_id=int(factory_id),
                )
                .prefetch_related(
                    "quotations__client",
                    "quotations__products__product",
                )
                .order_by("confirmed_at")
                .distinct()
            )

            result = []
            for project in projects:
                quotations = project.quotations.filter(
                    factory_id=int(factory_id)
                ).prefetch_related("client", "products__product")

                product_names = []
                client_name = None

                for quotation in quotations:
                    if client_name is None and quotation.client:
                        client_name = quotation.client.name

                    for quotation_product in quotation.products.all():
                        product_name = quotation_product.product.name
                        if product_name not in product_names:
                            product_names.append(product_name)

                days_since_confirmed = (
                    (today - project.confirmed_at).days
                    if project.confirmed_at is not None
                    else None
                )

                result.append(
                    StaleConfirmedProjectOut(
                        project_id=project.id,
                        client_name=client_name,
                        product_names=product_names,
                        days_since_confirmed=days_since_confirmed,
                    )
                )

            return result

        return await fetch_projects()

    except HttpError:
        raise
    except Exception:
        raise HttpError(500, "확정 후 7일 경과 프로젝트 조회 중 오류가 발생했습니다.")
