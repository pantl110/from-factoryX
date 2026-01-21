from ninja import Router
from ninja.errors import HttpError
from factory.models import FactoryMember
from api.security import jwt_auth
from factory.schemas.inbound import DashboardLayoutIn
from factory.schemas.outbound import DashboardLayoutOut
from factory.utils import is_factory_member

router = Router(tags=["FactoryMember V2"], auth=jwt_auth)


@router.get(
    "/me/dashboard-layout",
    summary="[C] 대시보드 레이아웃 조회",
    description="현재 로그인한 사용자의 대시보드 레이아웃을 조회합니다.",
    response=DashboardLayoutOut,
)
async def get_dashboard_layout(request):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    member = await is_factory_member(int(factory_id), user)

    layout = member.dashboard_layout
    return {"widgets": layout.get("widgets") if layout else None}


@router.put(
    "/me/dashboard-layout",
    summary="[C] 대시보드 레이아웃 저장",
    description="현재 로그인한 사용자의 대시보드 레이아웃을 저장합니다.",
    response=DashboardLayoutOut,
)
async def update_dashboard_layout(request, payload: DashboardLayoutIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    member = await is_factory_member(int(factory_id), user)

    member.dashboard_layout = {"widgets": payload.widgets}
    await member.asave()

    return {"widgets": payload.widgets}
