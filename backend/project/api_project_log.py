from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.permissions import require_factory_access
from api.pagination import PartnerPageNumberPagination
from api.security import api_key_auth, jwt_auth
from api.throttling import PartnerApiKeyThrottle
from project.models import Project, ProjectLog
from project.schemas.outbound import (
    ProjectLogDetailOut,
    ProjectLogCreateOut,
    ProjectLogUpdateOut,
)
from project.schemas.inbound import ProjectLogCreateIn, ProjectLogUpdateIn
from typing import List
from factory.utils import is_factory_member

router = Router(tags=["ProjectLog"], auth=jwt_auth)


def _serialize_refund(refund, log):
    plan_data = None
    if refund.plan:
        plan_data = {
            "id": refund.plan.id,
            "project_id": refund.plan.project_id,
            "status": refund.plan.status,
            "quantity": refund.plan.quantity,
            "start_date": refund.plan.start_date,
            "end_date": refund.plan.end_date,
            "avg_production_time": refund.plan.avg_production_time,
        }

    return {
        "id": refund.id,
        "product": {
            "id": refund.product.id,
            "name": refund.product.name,
            "code": refund.product.code,
            "unit": refund.product.unit,
            "spec": refund.product.spec,
            "current_stock": getattr(refund.product, "current_stock", 0),
        },
        "plan": plan_data,
        "amount": refund.amount,
        "refund_date": refund.refund_date,
        "current_stock": refund.current_stock,
        "production_amount": refund.production_amount,
        "log": {
            "id": log.id,
            "title": log.title,
            "content": log.content,
            "created_at": log.created_at,
        },
        "created_at": refund.created_at,
        "updated_at": refund.updated_at,
    }


@router.post(
    "",
    summary="[C] 프로젝트 로그 생성",
    description="새로운 프로젝트 로그를 생성합니다.",
    response={200: ProjectLogCreateOut, 400: dict, 404: dict, 500: dict},
)
async def create_project_log(request, payload: ProjectLogCreateIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        project = await Project.objects.aget(id=payload.project_id)
        # 프로젝트가 해당 공장에 속하는지 확인
        quotation_exists = await sync_to_async(
            project.quotations.filter(factory_id=int(factory_id)).exists
        )()
        if not quotation_exists:
            raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")
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
        project=project, type=payload.type, title=payload.title, content=payload.content
    )

    return 200, {
        "message": "프로젝트 로그가 성공적으로 생성되었습니다.",
        "log_id": log.id,
    }


@router.get(
    "",
    summary="[C] 프로젝트 로그 조회",
    description="project_id로 해당 프로젝트의 모든 로그를 조회합니다.",
    auth=[jwt_auth, api_key_auth],
    throttle=[PartnerApiKeyThrottle()],
    response={200: List[ProjectLogDetailOut], 404: dict, 500: dict},
)
@paginate(PartnerPageNumberPagination)
async def list_project_logs(request, project_id: int = Query(...), factory_id: int = Query(...)):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await require_factory_access(int(factory_id), user)

    try:
        project = await Project.objects.aget(id=project_id)
        # 프로젝트가 해당 공장에 속하는지 확인
        quotation_exists = await sync_to_async(
            project.quotations.filter(factory_id=int(factory_id)).exists
        )()
        if not quotation_exists:
            raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    @sync_to_async
    def get_project_logs_with_refunds():
        # select_related와 prefetch_related를 사용하여 쿼리 최적화
        logs = list(
            ProjectLog.objects.filter(project=project)
            .select_related("refund", "refund__product", "refund__plan")
            .order_by("-created_at")
        )
        logs_detail_list = []

        for log in logs:
            # 반품 로그인 경우 반품 상세 정보 가져오기
            refund_data = None
            if log.type == "refund" and log.refund:
                refund_data = _serialize_refund(log.refund, log)

            logs_detail_list.append(
                {
                    "id": log.id,
                    "project_id": log.project_id,
                    "type": log.type,
                    "title": log.title,
                    "content": log.content,
                    "refund": refund_data,
                    "created_at": log.created_at,
                    "updated_at": log.updated_at,
                }
            )

        return logs_detail_list

    logs_detail_list = await get_project_logs_with_refunds()

    if not logs_detail_list:
        raise HttpError(404, "해당 프로젝트에 생성된 로그가 없습니다.")

    return [ProjectLogDetailOut(**log_data) for log_data in logs_detail_list]


@router.patch(
    "/{log_id}",
    summary="[C] 프로젝트 로그 수정",
    description="프로젝트 로그의 타입, 제목, 내용을 수정합니다.",
    response={200: ProjectLogUpdateOut, 400: dict, 404: dict, 500: dict},
)
async def update_project_log(request, log_id: int, payload: ProjectLogUpdateIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        log = await ProjectLog.objects.select_related("project").aget(id=log_id)
        # 로그가 해당 공장의 프로젝트에 속하는지 확인
        quotation_exists = await sync_to_async(
            log.project.quotations.filter(factory_id=int(factory_id)).exists
        )()
        if not quotation_exists:
            raise HttpError(404, "해당 로그를 찾을 수 없습니다.")
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
