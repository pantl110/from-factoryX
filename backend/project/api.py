from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from project.schemas.inbound import ProjectCreateIn
from project.models import Project

router = Router(tags=["Project"], auth=jwt_auth)


@router.post(
    "/project/create",
    summary="[C] 프로젝트 생성",
    description="견적서 생성 단계에서 필요한 빈 프로젝트를 생성합니다.",
    response={201: ProjectCreateIn}
)
async def create_project(request):
    # 기본 값으로 프로젝트 생성
    new_project = await Project.objects.acreate()
    return 201, new_project


