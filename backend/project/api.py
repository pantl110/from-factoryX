from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.security import jwt_auth
from project.schemas.outbound import ProjectCreateOut
from project.models import Project
from document.models import Quotation

router = Router(tags=["Project"], auth=jwt_auth)

@router.post(
    "",
    summary="[C] 프로젝트 생성",
    description="프로젝트와 견적서를 동시에 생성합니다.",
    response={201: ProjectCreateOut, 500: dict}
)
async def create_project(request):
    try:
        new_project = await Project.objects.acreate()

        new_quotation = await Quotation.objects.acreate(
            project=new_project
        )

        return 201, {
            "id": new_quotation.id
        }

    except Exception as e:
        raise HttpError(500, "프로젝트 및 견적서 생성 중 내부 서버 오류가 발생했습니다.")


