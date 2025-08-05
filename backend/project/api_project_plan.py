from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from django.db import models
from project.schemas.inbound import ProjectPlanCreateIn, ProjectPlanUpdateIn, ProjectPlanListFilter
from project.schemas.outbound import ProjectPlansCreateOut, ProjectPlanDetailOut, ProjectPlanDetailWithRelationsOut, ProductDetailOut, QuotationProductDetailOut, EquipmentDetailOut, DailyProductionQuantityOut
from project.models import Project, ProjectPlan, ProjectLog
from document.models import Quotation, QuotationProduct
from factory.models import FactoryEquipment
from stock.models import Product
from datetime import date
from factory.models import Factory
from typing import List
from factory.utils import is_factory_member

router = Router(tags=["ProjectPlan"], auth=jwt_auth)


@router.post(
    "", 
    summary="[C] 프로젝트 생산 계획 생성", 
    description="프로젝트에 연결된 견적서 품목들을 기반으로 생산 계획을 생성합니다.",
    response={ 200: ProjectPlansCreateOut, 400: dict, 404: dict, 500: dict }
)
async def create_project_plans(request, payload: ProjectPlanCreateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
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
            avg_production_time=plan1.avg_production_time
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
            start_date_obj = date.fromisoformat(start_date)
            end_date_obj = date.fromisoformat(end_date)
            start_date2 = start_date_obj
            end_date2 = end_date_obj
            
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
                avg_production_time=plan2.avg_production_time
            ))
    
    return 200, ProjectPlansCreateOut(
        message=f"{len(created_plans)}개의 생산 계획이 성공적으로 생성되었습니다.",
        created_plans=created_plans
    )


@router.get(
    "/ongoing",
    summary="[C] 진행 중인 프로젝트 계획 조회",
    description="진행 중인 프로젝트의 생산 계획을 조회합니다. 프로젝트 이름으로 검색 가능합니다.",
    response={200: List[ProjectPlanDetailWithRelationsOut], 404: dict, 500: dict}
)
@paginate
async def list_ongoing_project_plans(request, filters: ProjectPlanListFilter = Query(...)):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        ongoing_statuses = [
            Project.ProjectStatus.quotation,
            Project.ProjectStatus.pending,
            Project.ProjectStatus.production
        ]
        
        @sync_to_async
        def get_ongoing_plans():
            queryset = Project.objects.filter(status__in=ongoing_statuses)
            queryset = filters.filter(queryset)
            ongoing_projects = list(queryset)
            
            if not ongoing_projects:
                return []
            
            project_ids = [project.id for project in ongoing_projects]
            plans = list(ProjectPlan.objects.filter(project_id__in=project_ids))
            
            if not plans:
                return []
            
            plans_detail_list = []
            for plan in plans:
                quotation_product = QuotationProduct.objects.get(id=plan.product_id)
                product = Product.objects.get(id=quotation_product.product_id)
                equipment = FactoryEquipment.objects.get(id=plan.equipment_id)
                
                plans_detail_list.append(ProjectPlanDetailWithRelationsOut(
                    id=plan.id,
                    project_id=plan.project_id,
                    quotation_product=QuotationProductDetailOut(
                        id=quotation_product.id,
                        product=ProductDetailOut(
                            id=product.id,
                            name=product.name,
                            code=product.code,
                            unit=product.unit,
                            spec=product.spec
                        ),
                        quantity=quotation_product.quantity,
                        unit_price=quotation_product.unit_price
                    ),
                    equipment=EquipmentDetailOut(
                        id=equipment.id,
                        name=equipment.name,
                        priority=equipment.priority
                    ),
                    status=plan.status,
                    quantity=plan.quantity,
                    start_date=plan.start_date,
                    end_date=plan.end_date,
                    avg_production_time=plan.avg_production_time
                ))
            return plans_detail_list

        plans_detail_list = await get_ongoing_plans()
        
        if not plans_detail_list:
            raise HttpError(404, "진행 중인 프로젝트에 생성된 생산 계획이 없습니다.")
        
        return plans_detail_list

    except HttpError:
        raise 

    except Exception as e:
        raise HttpError(500, f"서버 오류가 발생했습니다: {str(e)}")


@router.get(
    "/completed",
    summary="[C] 완료된 프로젝트 계획 조회",
    description="완료된 프로젝트의 생산 계획을 조회합니다. 프로젝트 이름으로 검색 가능합니다.",
    response={200: List[ProjectPlanDetailWithRelationsOut], 404: dict, 500: dict}
)
@paginate
async def list_completed_project_plans(request, filters: ProjectPlanListFilter = Query(...)):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        completed_statuses = [
            Project.ProjectStatus.manufactured,
            Project.ProjectStatus.delivery,
            Project.ProjectStatus.completed
        ]
        
        @sync_to_async
        def get_completed_plans():
            queryset = Project.objects.filter(status__in=completed_statuses)
            queryset = filters.filter(queryset)
            completed_projects = list(queryset)
            
            if not completed_projects:
                return []
            
            project_ids = [project.id for project in completed_projects]
            plans = list(ProjectPlan.objects.filter(project_id__in=project_ids))
            
            if not plans:
                return []
            
            plans_detail_list = []
            for plan in plans:
                quotation_product = QuotationProduct.objects.get(id=plan.product_id)
                product = Product.objects.get(id=quotation_product.product_id)
                equipment = FactoryEquipment.objects.get(id=plan.equipment_id)
                
                plans_detail_list.append(ProjectPlanDetailWithRelationsOut(
                    id=plan.id,
                    project_id=plan.project_id,
                    quotation_product=QuotationProductDetailOut(
                        id=quotation_product.id,
                        product=ProductDetailOut(
                            id=product.id,
                            name=product.name,
                            code=product.code,
                            unit=product.unit,
                            spec=product.spec
                        ),
                        quantity=quotation_product.quantity,
                        unit_price=quotation_product.unit_price
                    ),
                    equipment=EquipmentDetailOut(
                        id=equipment.id,
                        name=equipment.name,
                        priority=equipment.priority
                    ),
                    status=plan.status,
                    quantity=plan.quantity,
                    start_date=plan.start_date,
                    end_date=plan.end_date,
                    avg_production_time=plan.avg_production_time
                ))
            return plans_detail_list

        plans_detail_list = await get_completed_plans()
        
        if not plans_detail_list:
            raise HttpError(404, "완료된 프로젝트에 생성된 생산 계획이 없습니다.")
        
        return plans_detail_list

    except HttpError:
        raise

    except Exception as e:
        raise HttpError(500, f"서버 오류가 발생했습니다: {str(e)}")


@router.get(
    "/daily",
    summary="[C] 오늘 생산량 조회",
    description="오늘 완료된 생산 계획의 수량을 조회합니다. 전월 대비 수치도 포함됩니다.",
    response={200: DailyProductionQuantityOut, 404: dict, 500: dict}
)
async def get_daily_production_quantity(request, target_date: str = Query(None)):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        from datetime import datetime, timedelta
        
        # 날짜 파싱 (기본값: 오늘)
        if target_date:
            try:
                target_date_obj = datetime.strptime(target_date, "%Y-%m-%d").date()
            except ValueError:
                raise HttpError(400, "올바르지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 입력해주세요.")
        else:
            target_date_obj = date.today()
        
        @sync_to_async
        def get_production_data():
            # 해당 공장의 완료된 생산 계획 조회
            completed_plans = ProjectPlan.objects.filter(
                project__quotations__factory_id=int(factory_id),
                status="가동 완료",
                end_date=target_date_obj
            )
            
            # 오늘 생산량 집계
            production_count = completed_plans.count()
            production_quantity = completed_plans.aggregate(
                total_quantity=models.Sum('quantity')
            )['total_quantity'] or 0
            
            # 전월 대비 계산 (한 달 전)
            previous_month_date = target_date_obj - timedelta(days=30)
            previous_month_plans = ProjectPlan.objects.filter(
                project__quotations__factory_id=int(factory_id),
                status="가동 완료",
                end_date=previous_month_date
            )
            
            previous_month_count = previous_month_plans.count()
            previous_month_quantity = previous_month_plans.aggregate(
                total_quantity=models.Sum('quantity')
            )['total_quantity'] or 0
            
            # 변화율 계산
            change_percentage = None
            if previous_month_quantity > 0:
                change_percentage = round(
                    ((production_quantity - previous_month_quantity) / previous_month_quantity) * 100, 2
                )
            
            return {
                "production_count": production_count,
                "production_quantity": production_quantity,
                "previous_month_count": previous_month_count if previous_month_count > 0 else None,
                "previous_month_quantity": previous_month_quantity if previous_month_quantity > 0 else None,
                "change_percentage": change_percentage
            }
        
        result = await get_production_data()
        return 200, DailyProductionQuantityOut(**result)
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"오늘 생산량 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "",
    summary="[C] 프로젝트 생산 계획 조회",
    description="project_id로 해당 프로젝트의 모든 생산 계획을 조회합니다.",
    response={200: List[ProjectPlanDetailWithRelationsOut], 404: dict, 500: dict}
)
async def list_project_plans(request, project_id: int):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    try:
        project = await Project.objects.aget(id=project_id)
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")
    
    plans = await sync_to_async(list)(
        ProjectPlan.objects.filter(project=project)
    )
    
    if not plans:
        raise HttpError(404, "해당 프로젝트에 생성된 생산 계획이 없습니다.")
    
    plans_detail_list = []

    for plan in plans:
        quotation_product = await QuotationProduct.objects.aget(id=plan.product_id)
        product = await Product.objects.aget(id=quotation_product.product_id)
        equipment = await FactoryEquipment.objects.aget(id=plan.equipment_id)
        
        plans_detail_list.append(ProjectPlanDetailWithRelationsOut(
            id=plan.id,
            project_id=project_id,
            quotation_product=QuotationProductDetailOut(
                id=quotation_product.id,
                product=ProductDetailOut(
                    id=product.id,
                    name=product.name,
                    code=product.code,
                    unit=product.unit,
                    spec=product.spec
                ),
                quantity=quotation_product.quantity,
                unit_price=quotation_product.unit_price
            ),
            equipment=EquipmentDetailOut(
                id=equipment.id,
                name=equipment.name,
                priority=equipment.priority
            ),
            status=plan.status,
            quantity=plan.quantity,
            start_date=plan.start_date,
            end_date=plan.end_date,
            avg_production_time=plan.avg_production_time
        ))
    
    return 200, plans_detail_list


@router.patch(
    "/{plan_id}",
    summary="[C] 프로젝트 생산 계획 수정",
    description="생산 계획의 기기, 수량, 상태, 일정 등을 수정합니다. 수량 수정 시 견적서 수량과 일치하도록 자동으로 분할됩니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict}
)
async def update_project_plan(request, plan_id: int, payload: ProjectPlanUpdateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    try:
        plan = await ProjectPlan.objects.aget(id=plan_id)
    except ProjectPlan.DoesNotExist:
        raise HttpError(404, "해당 생산 계획을 찾을 수 없습니다.")
    
    old_equipment = await FactoryEquipment.objects.aget(id=plan.equipment_id) if plan.equipment_id else None
    
    # 미리 project, product를 비동기 안전하게 가져옴
    project = await sync_to_async(lambda: plan.project)()
    product = await sync_to_async(lambda: plan.product)()

    if payload.equipment_id is not None:
        try:
            equipment = await FactoryEquipment.objects.aget(id=payload.equipment_id)
            plan.equipment = equipment
        except FactoryEquipment.DoesNotExist:
            raise HttpError(400, f"설비 ID {payload.equipment_id}를 찾을 수 없습니다.")
    
    if payload.quantity is not None:
        if payload.quantity <= 0:
            raise HttpError(400, "수량은 0보다 커야 합니다.")
        
        # 견적서 수량을 안전하게 가져오기
        quotation_quantity = await sync_to_async(lambda: plan.product.quantity)()
        new_quantity = payload.quantity
        
        # 기존에 남은 수량 계획이 있다면 삭제
        await ProjectPlan.objects.filter(
            project=project,
            product=product,
            id__gt=plan.id  # 현재 계획보다 나중에 생성된 계획들
        ).adelete()
        
        # 사용자가 수정한 수량이 주문 수량보다 적은 경우
        if new_quantity < quotation_quantity:
            # 첫 번째 계획: 사용자가 수정한 수량
            plan.quantity = new_quantity
            
            # 두 번째 계획: 부족한 수량에 buffer rate 적용
            product_obj = await sync_to_async(lambda: plan.product.product)()
            buffer_rate = float(product_obj.buffer_rate)
            shortage_quantity = quotation_quantity - new_quantity
            buffer_quantity = int(shortage_quantity * (1 + buffer_rate))
            
            await ProjectPlan.objects.acreate(
                project=project,
                product=product,
                quantity=buffer_quantity,
                equipment=plan.equipment,  # 같은 설비 사용
                start_date=plan.start_date,
                end_date=plan.end_date,
                avg_production_time=plan.avg_production_time
            )
            
            # Buffer rate는 기존 값 유지 (총 생산량이 주문량과 동일하므로)
            
        # 사용자가 수정한 수량이 주문 수량보다 큰 경우
        elif new_quantity > quotation_quantity:
            # 새로운 buffer rate 계산: (생산수량 - 주문수량) / 주문수량
            new_buffer_rate = (new_quantity - quotation_quantity) / quotation_quantity
            # 제품의 buffer rate 업데이트
            product_obj = await sync_to_async(lambda: plan.product.product)()
            product_obj.buffer_rate = new_buffer_rate
            await sync_to_async(product_obj.save)()
            
            # 기존 계획 수정
            plan.quantity = new_quantity
            
        # 사용자가 수정한 수량이 주문 수량과 같은 경우
        else:
            # 기존 계획 수정
            plan.quantity = new_quantity
            # Buffer rate는 기존 값 유지 (변경하지 않음)

    # 이후에도 plan.project, plan.product 대신 project, product 사용
    if payload.status is not None:
        valid_statuses = [choice[0] for choice in ProjectPlan.ProductionStatus.choices]
        if payload.status not in valid_statuses:
            raise HttpError(400, "올바르지 않은 상태값입니다.")
        plan.status = payload.status
    
    if payload.start_date is not None:
        plan.start_date = payload.start_date
    
    if payload.end_date is not None:
        plan.end_date = payload.end_date
    
    if payload.avg_production_time is not None:
        if payload.avg_production_time <= 0:
            raise HttpError(400, "평균 생산 시간은 0보다 커야 합니다.")

        plan.avg_production_time = payload.avg_production_time
    
    await plan.asave()
    
    if (payload.equipment_id is not None and 
        old_equipment and 
        plan.equipment and 
        old_equipment.id != plan.equipment.id and
        plan.status == "가동 중"):  # 가동 중 상태 확인
        await ProjectLog.objects.acreate(
            project=project,
            type=ProjectLog.LogType.plan,
            title="생산 설비 변경",
            content=f"사용 설비가 {old_equipment.name}라인에서 {plan.equipment.name}라인으로 변경되었어요"
        )
    
    return 200, {"message": "프로젝트 생산 계획이 성공적으로 수정되었습니다."}