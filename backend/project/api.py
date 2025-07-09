from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from project.schemas.inbound import (
    ProjectCreateIn, ProjectUpdateIn, ProjectPlanCreateIn, ProjectPlanUpdateIn, ProjectLogCreateIn
)
from project.schemas.outbound import ProjectOut, ProjectPlanOut, ProjectLogOut
from project.models import Project, ProjectPlan, ProjectLog
from document.models import Quotation, QuotationProduct
from factory.models import FactoryEquipment
from asgiref.sync import sync_to_async
from typing import List

router = Router(tags=["Project"])

# 프로젝트 생성
@router.post(
    "/projects",
    summary="[C] 프로젝트 생성",
    description="견적서와 연동하여 새로운 프로젝트를 생성합니다.",
    response={201: ProjectOut},
    auth=jwt_auth
)
async def create_project(request, payload: ProjectCreateIn):
    user = request.auth
    quotation = await Quotation.objects.aget(id=payload.quotation_id)
    project = await Project.objects.acreate(
        status=payload.status or Project.ProjectStatus.quotation,
        transact_date=payload.transact_date,
    )
    return 201, ProjectOut.model_validate({
        "id": project.id,
        "status": project.status,
        "transact_date": project.transact_date,
        "tax_invoice_id": project.tax_invoice_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    })

# 진행 중 프로젝트 목록
@router.get(
    "/projects/active",
    summary="[C] 진행 중 프로젝트 목록 조회",
    description="진행 중(견적, 대기, 생산, 완료, 납품) 상태의 프로젝트 목록을 조회합니다.",
    response={200: List[ProjectOut]},
    auth=jwt_auth
)
@paginate
async def list_active_projects(request):
    queryset = await sync_to_async(list)(Project.objects.filter(status__in=[
        Project.ProjectStatus.quotation,
        Project.ProjectStatus.pending,
        Project.ProjectStatus.production,
        Project.ProjectStatus.manufactured,
        Project.ProjectStatus.delivery,
    ]).order_by("-created_at"))
    return [ProjectOut.model_validate({
        "id": project.id,
        "status": project.status,
        "transact_date": project.transact_date,
        "tax_invoice_id": project.tax_invoice_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }) for project in queryset]

# 보관된(완료/중단) 프로젝트 목록
@router.get(
    "/projects/completed",
    summary="[C] 보관된 프로젝트 목록 조회",
    description="완료된 프로젝트 목록을 조회합니다.",
    response={200: List[ProjectOut]},
    auth=jwt_auth
)
@paginate
async def list_completed_projects(request):
    queryset = await sync_to_async(list)(Project.objects.filter(status=Project.ProjectStatus.completed).order_by("-created_at"))
    return [ProjectOut.model_validate({
        "id": project.id,
        "status": project.status,
        "transact_date": project.transact_date,
        "tax_invoice_id": project.tax_invoice_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }) for project in queryset]

# 프로젝트 상세 조회
@router.get(
    "/projects/{project_id}",
    summary="[C] 프로젝트 상세 조회",
    description="프로젝트 ID로 프로젝트 상세 정보를 조회합니다.",
    response={200: ProjectOut},
    auth=jwt_auth
)
async def get_project(request, project_id: int):
    project = await Project.objects.aget(id=project_id)
    return ProjectOut.model_validate({
        "id": project.id,
        "status": project.status,
        "transact_date": project.transact_date,
        "tax_invoice_id": project.tax_invoice_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    })

# 프로젝트 수정
@router.patch(
    "/projects/{project_id}",
    summary="[C] 프로젝트 정보 수정",
    description="프로젝트 ID로 프로젝트 정보를 수정합니다.",
    response={200: ProjectOut},
    auth=jwt_auth
)
async def update_project(request, project_id: int, payload: ProjectUpdateIn):
    project = await Project.objects.aget(id=project_id)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(project, attr, value)
    await project.asave()
    return ProjectOut.model_validate({
        "id": project.id,
        "status": project.status,
        "transact_date": project.transact_date,
        "tax_invoice_id": project.tax_invoice_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    })

# 프로젝트 삭제
@router.delete(
    "/projects/{project_id}",
    summary="[C] 프로젝트 삭제",
    description="프로젝트 ID로 프로젝트를 삭제합니다.",
    response={204: None},
    auth=jwt_auth
)
async def delete_project(request, project_id: int):
    project = await Project.objects.aget(id=project_id)
    await project.adelete()
    return 204, None

# 생산 계획 생성
@router.post(
    "/projects/{project_id}/plans",
    summary="[C] 생산 계획 생성",
    description="프로젝트에 대한 생산 계획(내역)을 생성합니다.",
    response={201: ProjectPlanOut},
    auth=jwt_auth
)
async def create_project_plan(request, project_id: int, payload: ProjectPlanCreateIn):
    project = await Project.objects.aget(id=project_id)
    product = await QuotationProduct.objects.aget(id=payload.product_id)
    equipment = await FactoryEquipment.objects.aget(id=payload.equipment_id)
    plan = await ProjectPlan.objects.acreate(
        project=project,
        product=product,
        quantity=payload.quantity,
        equipment=equipment,
        start_date=payload.start_date,
        end_date=payload.end_date,
        avg_production_time=payload.avg_production_time,
        status=payload.status or ProjectPlan.ProductionStatus.pending,
    )
    return 201, ProjectPlanOut.model_validate({
        "id": plan.id,
        "project_id": plan.project_id,
        "product_id": plan.product_id,
        "quantity": plan.quantity,
        "equipment_id": plan.equipment_id,
        "start_date": plan.start_date,
        "end_date": plan.end_date,
        "avg_production_time": plan.avg_production_time,
        "status": plan.status,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
    })

# 생산 계획 목록
@router.get(
    "/projects/{project_id}/plans",
    summary="[C] 생산 계획 목록 조회",
    description="프로젝트별 생산 계획(내역) 목록을 조회합니다.",
    response={200: List[ProjectPlanOut]},
    auth=jwt_auth
)
@paginate
async def list_project_plans(request, project_id: int):
    queryset = await sync_to_async(list)(ProjectPlan.objects.filter(project_id=project_id).order_by("-created_at"))
    return [ProjectPlanOut.model_validate({
        "id": plan.id,
        "project_id": plan.project_id,
        "product_id": plan.product_id,
        "quantity": plan.quantity,
        "equipment_id": plan.equipment_id,
        "start_date": plan.start_date,
        "end_date": plan.end_date,
        "avg_production_time": plan.avg_production_time,
        "status": plan.status,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
    }) for plan in queryset]

# 생산 계획 수정
@router.patch(
    "/plans/{plan_id}",
    summary="[C] 생산 계획 정보 수정",
    description="생산 계획(내역) ID로 생산 계획 정보를 수정합니다.",
    response={200: ProjectPlanOut},
    auth=jwt_auth
)
async def update_project_plan(request, plan_id: int, payload: ProjectPlanUpdateIn):
    plan = await ProjectPlan.objects.aget(id=plan_id)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(plan, attr, value)
    await plan.asave()
    return ProjectPlanOut.model_validate({
        "id": plan.id,
        "project_id": plan.project_id,
        "product_id": plan.product_id,
        "quantity": plan.quantity,
        "equipment_id": plan.equipment_id,
        "start_date": plan.start_date,
        "end_date": plan.end_date,
        "avg_production_time": plan.avg_production_time,
        "status": plan.status,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
    })

# 생산 로그 생성
@router.post(
    "/projects/{project_id}/logs",
    summary="[C] 생산 로그 생성",
    description="프로젝트별 생산 로그(계획 변경, 메모, 반품 등)를 생성합니다.",
    response={201: ProjectLogOut},
    auth=jwt_auth
)
async def create_project_log(request, project_id: int, payload: ProjectLogCreateIn):
    project = await Project.objects.aget(id=project_id)
    log = await ProjectLog.objects.acreate(
        project=project,
        type=payload.type,
        title=payload.title,
        content=payload.content,
    )
    return 201, ProjectLogOut.model_validate({
        "id": log.id,
        "project_id": log.project_id,
        "type": log.type,
        "title": log.title,
        "content": log.content,
        "created_at": log.created_at,
        "updated_at": log.updated_at,
    })

# 생산 로그 목록
@router.get(
    "/projects/{project_id}/logs",
    summary="[C] 생산 로그 목록 조회",
    description="프로젝트별 생산 로그(계획 변경, 메모, 반품 등) 목록을 조회합니다.",
    response={200: List[ProjectLogOut]},
    auth=jwt_auth
)
@paginate
async def list_project_logs(request, project_id: int):
    queryset = await sync_to_async(list)(ProjectLog.objects.filter(project_id=project_id).order_by("-created_at"))
    return [ProjectLogOut.model_validate({
        "id": log.id,
        "project_id": log.project_id,
        "type": log.type,
        "title": log.title,
        "content": log.content,
        "created_at": log.created_at,
        "updated_at": log.updated_at,
    }) for log in queryset]
