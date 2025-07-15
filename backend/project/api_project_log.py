from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from project.models import Project, ProjectLog
from project.schemas.outbound import ProjectLogDetailOut, ProjectLogCreateIn, ProjectLogUpdateIn, ProjectLogCreateOut, ProjectLogUpdateOut
from typing import List

router = Router(tags=["ProjectLog"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 프로젝트 로그 생성",
    description="새로운 프로젝트 로그를 생성합니다.",
    response={200: ProjectLogCreateOut, 400: dict, 404: dict, 500: dict}
)
async def create_project_log(request, payload: ProjectLogCreateIn):
    try:
        project = await Project.objects.aget(id=payload.project_id)
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")
    
    # 로그 타입 유효성 검증
    valid_types = [choice[0] for choice in ProjectLog.LogType.choices]
    if payload.type not in valid_types:
        raise HttpError(400, "올바르지 않은 로그 타입입니다.")
    
    # 제목 길이 검증
    if len(payload.title) > 100:
        raise HttpError(400, "제목은 100자를 초과할 수 없습니다.")
    
    # 로그 생성
    log = await ProjectLog.objects.acreate(
        project=project,
        type=payload.type,
        title=payload.title,
        content=payload.content
    )
    
    return 200, {
        "message": "프로젝트 로그가 성공적으로 생성되었습니다.",
        "log_id": log.id
    }


@router.get(
    "",
    summary="[C] 프로젝트 로그 조회",
    description="project_id로 해당 프로젝트의 모든 로그를 조회합니다.",
    response={200: List[ProjectLogDetailOut], 404: dict, 500: dict}
)
@paginate
async def list_project_logs(request, project_id: int = Query(...)):
    try:
        project = await Project.objects.aget(id=project_id)
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")
    
    @sync_to_async
    def get_project_logs():
        logs = list(ProjectLog.objects.filter(project=project).order_by('-created_at'))
        return logs
    
    logs = await get_project_logs()
    
    if not logs:
        raise HttpError(404, "해당 프로젝트에 생성된 로그가 없습니다.")
    
    logs_detail_list = []
    for log in logs:
        logs_detail_list.append(ProjectLogDetailOut(
            id=log.id,
            project_id=log.project_id,  # 직접 project_id 필드 사용
            type=log.type,
            title=log.title,
            content=log.content
        ))
    
    return logs_detail_list


@router.patch(
    "/{log_id}",
    summary="[C] 프로젝트 로그 수정",
    description="프로젝트 로그의 타입, 제목, 내용을 수정합니다.",
    response={200: ProjectLogUpdateOut, 400: dict, 404: dict, 500: dict}
)
async def update_project_log(request, log_id: int, payload: ProjectLogUpdateIn):
    try:
        log = await ProjectLog.objects.aget(id=log_id)
    except ProjectLog.DoesNotExist:
        raise HttpError(404, "해당 로그를 찾을 수 없습니다.")
    
    # 타입 수정
    if payload.type is not None:
        valid_types = [choice[0] for choice in ProjectLog.LogType.choices]
        if payload.type not in valid_types:
            raise HttpError(400, "올바르지 않은 로그 타입입니다.")
        log.type = payload.type
    
    # 제목 수정
    if payload.title is not None:
        if len(payload.title) > 100:
            raise HttpError(400, "제목은 100자를 초과할 수 없습니다.")
        log.title = payload.title
    
    # 내용 수정
    if payload.content is not None:
        log.content = payload.content
    
    await log.asave()
    
    return 200, {"message": "프로젝트 로그가 성공적으로 수정되었습니다."}
