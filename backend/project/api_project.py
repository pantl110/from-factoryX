from ninja import Router
from ninja.errors import HttpError
from api.security import jwt_auth
from project.schemas.outbound import ProjectCreateOut, ProjectDetailOut, ProjectUpdateOut
from project.schemas.inbound import ProjectStatusUpdateIn, ProjectTransactDateUpdateIn
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


@router.delete(
    "/{project_id}",
    summary="[C] 프로젝트 삭제",
    description="프로젝트를 삭제합니다.",
    response={200: ProjectUpdateOut, 404: dict, 500: dict}
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


@router.patch(
    "/{project_id}/status",
    summary="[C] 프로젝트 상태 업데이트",
    description="프로젝트의 상태를 업데이트합니다.",
    response={200: ProjectDetailOut, 400: dict, 404: dict, 500: dict}
)
async def update_project_status(request, project_id: int, payload: ProjectStatusUpdateIn):
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
            updated_at=project.updated_at
        )
        
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    except Exception as e:
        raise HttpError(500, "프로젝트 상태 업데이트 중 내부 서버 오류가 발생했습니다.")


@router.patch(
    "/{project_id}/transact-date",
    summary="[C] 거래명세서 발급일 업데이트",
    description="프로젝트의 거래명세서 발급일을 업데이트합니다.",
    response={200: ProjectDetailOut, 404: dict, 500: dict}
)
async def update_project_transact_date(request, project_id: int, payload: ProjectTransactDateUpdateIn):
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
            updated_at=project.updated_at
        )
        
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    except Exception as e:
        raise HttpError(500, "거래명세서 발급일 업데이트 중 내부 서버 오류가 발생했습니다.")