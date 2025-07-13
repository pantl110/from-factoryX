from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from project.schemas.inbound import ProjectPlanCreateIn
from project.schemas.outbound import ProjectPlansCreateOut, ProjectPlanDetailOut
from project.models import Project, ProjectPlan
from document.models import Quotation, QuotationProduct
from factory.models import FactoryEquipment
from datetime import date, timedelta
from factory.models import Factory
from typing import List

router = Router(tags=["ProjectPlan"], auth=jwt_auth)


@router.post(
    "", 
    summary="[C] 프로젝트 생산 계획 생성", 
    description="프로젝트에 연결된 견적서 품목들을 기반으로 생산 계획을 생성합니다.",
    response={ 200: ProjectPlansCreateOut, 400: dict, 404: dict, 500: dict }
)
async def create_project_plans(request, payload: ProjectPlanCreateIn):
    try:
        # 1. 프로젝트 존재 확인
        project = await Project.objects.aget(id=payload.project_id)
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")
    
    try:
        quotation = await Quotation.objects.aget(project=project)
    except Quotation.DoesNotExist:
        raise HttpError(404, "해당 프로젝트에 연결된 견적서를 찾을 수 없습니다.")
    
    quotation_products = await sync_to_async(list)(
        QuotationProduct.objects.filter(
            id__in=payload.quotation_product_ids,
            quotation=quotation
        )
    )
    
    if len(quotation_products) != len(payload.quotation_product_ids):
        raise HttpError(400, "일부 견적서 품목을 찾을 수 없습니다.")
    
    factory_id = quotation.factory_id
    if not factory_id:
        raise HttpError(400, "견적서에 연결된 공장 정보가 없습니다.")
    factory = await Factory.objects.aget(id=factory_id)
    
    equipments = await sync_to_async(list)(
        FactoryEquipment.objects.filter(factory=factory)
    )
    
    if not equipments:
        raise HttpError(400, "해당 공장에 등록된 설비가 없습니다.")
    
    if payload.equipment_ids:
        valid_equipment_ids = [eq.id for eq in equipments]
        for equipment_id in payload.equipment_ids:
            if equipment_id not in valid_equipment_ids:
                raise HttpError(400, f"설비 ID {equipment_id}를 찾을 수 없습니다.")
    
    # 6. 생산 계획 생성
    created_plans = []
    
    for i, quotation_product in enumerate(quotation_products):
        # 필수 입력값 검증
        if not payload.production_quantities or i >= len(payload.production_quantities):
            raise HttpError(400, f"품목 {i+1}의 생산 수량이 필요합니다.")
        if not payload.equipment_ids or i >= len(payload.equipment_ids):
            raise HttpError(400, f"품목 {i+1}의 설비 ID가 필요합니다.")
        if not payload.start_dates or i >= len(payload.start_dates):
            raise HttpError(400, f"품목 {i+1}의 시작일이 필요합니다.")
        if not payload.end_dates or i >= len(payload.end_dates):
            raise HttpError(400, f"품목 {i+1}의 종료일이 필요합니다.")
        if not payload.avg_production_times or i >= len(payload.avg_production_times):
            raise HttpError(400, f"품목 {i+1}의 평균 생산 시간이 필요합니다.")
        
        # 사용자 입력값 사용
        production_quantity = payload.production_quantities[i]
        equipment_id = payload.equipment_ids[i]
        start_date = payload.start_dates[i]
        end_date = payload.end_dates[i]
        avg_production_time = payload.avg_production_times[i]
        
        # 설비 검증
        equipment = next((eq for eq in equipments if eq.id == equipment_id), None)
        if not equipment:
            raise HttpError(400, f"설비 ID {equipment_id}를 찾을 수 없습니다.")
        
        # 첫 번째 ProjectPlan 생성 (생산 수량)
        plan1 = await ProjectPlan.objects.acreate(
            project=project,
            product=quotation_product,
            equipment=equipment,
            quantity=production_quantity,
            start_date=start_date,
            end_date=end_date,
            avg_production_time=avg_production_time
        )
        
        created_plans.append(ProjectPlanDetailOut(
            id=plan1.id,
            project_id=plan1.project.id,
            quotation_product_id=plan1.product.id,
            equipment_id=plan1.equipment.id,
            status=plan1.status,
            quantity=plan1.quantity,
            start_date=plan1.start_date,
            end_date=plan1.end_date,
            avg_production_time=plan1.avg_production_time,
            created_at=plan1.created_at,
            updated_at=plan1.updated_at
        ))
        
        # 남은 수량이 있으면 두 번째 ProjectPlan 생성
        remaining_quantity = quotation_product.quantity - production_quantity
        if remaining_quantity > 0:
            # 두 번째 설비 (기본값: 첫 번째 설비)
            equipment2 = equipments[0]
            if payload.equipment_ids and i < len(payload.equipment_ids):
                equipment_id = payload.equipment_ids[i]
                equipment2 = next(eq for eq in equipments if eq.id == equipment_id)
            
            # 두 번째 생산 일정 (기본값: 첫 번째 일정 + 1일)
            start_date2 = start_date + timedelta(days=1)
            end_date2 = end_date + timedelta(days=1)
            
            plan2 = await ProjectPlan.objects.acreate(
                project=project,
                product=quotation_product,
                equipment=equipment2,
                quantity=remaining_quantity,
                start_date=start_date2,
                end_date=end_date2,
                avg_production_time=avg_production_time
            )
            
            created_plans.append(ProjectPlanDetailOut(
                id=plan2.id,
                project_id=plan2.project.id,
                quotation_product_id=plan2.product.id,
                equipment_id=plan2.equipment.id,
                status=plan2.status,
                quantity=plan2.quantity,
                start_date=plan2.start_date,
                end_date=plan2.end_date,
                avg_production_time=plan2.avg_production_time,
                created_at=plan2.created_at,
                updated_at=plan2.updated_at
            ))
    
    return 200, ProjectPlansCreateOut(
        message=f"{len(created_plans)}개의 생산 계획이 성공적으로 생성되었습니다.",
        created_plans=created_plans
    )


@router.get(
    "",
    summary="[C] 프로젝트 생산 계획 조회",
    description="project_id로 해당 프로젝트의 모든 생산 계획을 조회합니다.",
    response={200: List[ProjectPlanDetailOut], 404: dict, 500: dict}
)
async def list_project_plans(request, project_id: int):
    try:
        # 프로젝트 존재 확인
        project = await Project.objects.aget(id=project_id)
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")
    
    # 해당 프로젝트의 모든 생산 계획 조회
    plans = await sync_to_async(list)(
        ProjectPlan.objects.filter(project=project)
    )
    
    if not plans:
        raise HttpError(404, "해당 프로젝트에 생성된 생산 계획이 없습니다.")
    
    # 응답 데이터 구성
    plans_detail_list = [
        ProjectPlanDetailOut(
            id=plan.id,
            project_id=project_id,  # 직접 project_id 사용
            quotation_product_id=plan.product_id,  # ForeignKey ID 직접 사용
            equipment_id=plan.equipment_id,  # ForeignKey ID 직접 사용
            status=plan.status,
            quantity=plan.quantity,
            start_date=plan.start_date,
            end_date=plan.end_date,
            avg_production_time=plan.avg_production_time,
            created_at=plan.created_at,
            updated_at=plan.updated_at
        ) for plan in plans
    ]
    
    return 200, plans_detail_list