from ninja import Router, Query
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from datetime import datetime, timedelta
from typing import List
from api.security import jwt_auth

from project.models import Project, ProjectLog, Refund
from project.schemas.outbound import RefundCreateOut, RefundUpdateOut, RefundListOut, RefundDetailOut, RefundProductionRegistrationOut
from project.schemas.inbound import RefundCreateIn, RefundUpdateIn
from stock.models import Product
from document.models import Quotation, QuotationProduct
from factory.models import FactoryEquipment
from factory.utils import is_factory_member


router = Router(tags=["ProjectRefund"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 반품 생성",
    description="반품을 생성하고 관련 로그를 기록합니다. 현재 재고는 Product의 실제 재고량에서 자동으로 가져옵니다.",
    response={200: RefundCreateOut, 400: dict, 404: dict, 500: dict}
)
async def create_refund(request, payload: RefundCreateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    try:
        project = await sync_to_async(Project.objects.get)(id=payload.project_id)
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")
    
    try:
        product = await sync_to_async(Product.objects.get)(id=payload.product_id)
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품을 찾을 수 없습니다.")
    
    # Product의 실제 현재 재고를 사용
    current_stock = product.current_stock
    production_amount = payload.production_amount if payload.production_amount is not None else 0
    refund_amount = current_stock + production_amount
    
    if refund_amount <= 0:
        raise HttpError(400, "반품 수량은 0보다 커야 합니다.")
    
    try:
        refund_date = datetime.strptime(payload.refund_date, "%Y-%m-%d").date()
    except ValueError:
        raise HttpError(400, "올바르지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 입력해주세요.")
    
    log = await sync_to_async(ProjectLog.objects.create)(
        project=project,
        type=ProjectLog.LogType.refund,
        title="반품 접수 현황",
        content=f"{product.name} {refund_amount}개가 반품되었어요."
    )
    
    # Refund 생성
    refund = await sync_to_async(Refund.objects.create)(
        project_log=log,
        product=product,
        amount=refund_amount,
        refund_date=refund_date,
        current_stock=current_stock,
        production_amount=production_amount
    )
    
    return 200, {
        "message": "반품이 성공적으로 생성되었습니다.",
        "refund_id": refund.id,
        "log_id": log.id
    }


@router.post(
    "/{refund_id}",
    summary="[C] 반품 생산 등록",
    description="반품 정보를 기반으로 quotation product와 생산 계획을 생성합니다.",
    response={200: RefundProductionRegistrationOut, 400: dict, 404: dict, 500: dict}
)
async def register_production_from_refund(request, refund_id: int):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    try:
        refund = await sync_to_async(Refund.objects.select_related(
            'product', 
            'project_log', 
            'project_log__project'
        ).get)(id=refund_id)
    except Refund.DoesNotExist:
        raise HttpError(404, "해당 반품을 찾을 수 없습니다.")
    
    # 팩토리 권한 확인
    quotation_exists = await sync_to_async(refund.project_log.project.quotations.filter(factory_id=int(factory_id)).exists)()
    if not quotation_exists:
        raise HttpError(404, "해당 반품을 찾을 수 없습니다.")
    
    # 반품 수량이 0보다 큰지 확인
    if refund.amount <= 0:
        raise HttpError(400, "반품 수량이 0보다 커야 합니다.")
    
    # 이미 생산 등록된 반품인지 확인
    if hasattr(refund, 'production_registered') and refund.production_registered:
        raise HttpError(400, "이미 생산 등록된 반품입니다.")
    
    try:
        # 1. 기존 Quotation 찾기 (같은 프로젝트의 첫 번째 견적서)
        existing_quotation = await sync_to_async(
            refund.project_log.project.quotations.filter(factory_id=int(factory_id)).first
        )()
        
        if not existing_quotation:
            raise HttpError(404, "해당 프로젝트의 견적서를 찾을 수 없습니다.")
        
        # 2. 새로운 QuotationProduct 생성 (반품용)
        new_quotation_product = await sync_to_async(QuotationProduct.objects.create)(
            quotation=existing_quotation,
            product=refund.product,
            quantity=refund.amount,
            unit_price=0,  # 반품은 단가 0으로 설정
            delivery_date=datetime.now().date() + timedelta(days=7)  # 기본 7일 후 납품 예정
        )
        
        # 3. 기본 장비 선택 (우선순위가 가장 높은 장비)
        default_equipment = await sync_to_async(FactoryEquipment.objects.filter(
            factory_id=int(factory_id)
        ).order_by('priority').first)()
        
        if not default_equipment:
            raise HttpError(400, "사용 가능한 장비가 없습니다.")
        
        # 4. 원자재 소모 처리
        from stock.models import MaterialProduct, Material
        
        @sync_to_async
        def consume_raw_materials():
            material_products = MaterialProduct.objects.filter(product=refund.product)
            for material_product in material_products:
                material = material_product.material
                required_quantity = material_product.quantity * refund.amount
                
                if material.current_stock < required_quantity:
                    raise HttpError(400, f"원자재 {material.name}의 재고가 부족합니다. 필요: {required_quantity}, 보유: {material.current_stock}")
                
                # 재고 차감
                material.current_stock -= required_quantity
                material.save()
        
        await consume_raw_materials()
        
        # 5. 생산 계획 생성 (새로운 QuotationProduct 사용)
        from project.models import ProjectPlan
        
        # 품목의 평균 생산 시간 가져오기 (기본값 30초)
        avg_production_time = await sync_to_async(lambda: refund.product.average_production_time)()
        if avg_production_time is None:
            avg_production_time = 30  # 기본값 30초
        
        # 마감 시간 계산: 시작일 + (평균 생산 시간 × 수량)
        total_production_seconds = avg_production_time * refund.amount
        production_days = int(total_production_seconds / (24 * 3600))
        if production_days == 0:
            production_days = 1  # 최소 1일
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=production_days)
        
        project_plan = await sync_to_async(ProjectPlan.objects.create)(
            project=refund.project_log.project,
            product=new_quotation_product,  # 새로운 QuotationProduct 사용
            equipment=default_equipment,
            status="가동 대기",
            quantity=refund.amount,
            start_date=start_date,
            end_date=end_date,
            avg_production_time=avg_production_time,  # 품목의 평균 생산 시간 사용
            is_refunded=True  # 반품 여부를 True로 설정
        )
        
        # 6. 프로젝트 로그 생성
        production_log = await sync_to_async(ProjectLog.objects.create)(
            project=refund.project_log.project,
            type="계획 변경",
            title="반품 재생산 등록",
            content=f"{refund.product.name} {refund.amount}개 반품 재생산이 등록되었습니다."
        )
        
        return 200, {
            "message": "반품 재생산이 성공적으로 등록되었습니다.",
            "refund_id": refund.id,
            "quotation_id": existing_quotation.id,
            "quotation_product_id": new_quotation_product.id,
            "project_plan_id": project_plan.id,
            "production_log_id": production_log.id,
            "product_name": refund.product.name,
            "quantity": refund.amount,
            "equipment_name": default_equipment.name
        }
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"생산 등록 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{refund_id}",
    summary="[C] 반품 상세 조회",
    description="특정 반품의 상세 정보를 조회합니다.",
    response={200: RefundDetailOut, 400: dict, 404: dict, 500: dict}
)
async def get_refund_detail(request, refund_id: int):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    try:
        refund = await sync_to_async(Refund.objects.select_related(
            'product', 
            'project_log', 
            'project_log__project'
        ).get)(id=refund_id)
    except Refund.DoesNotExist:
        raise HttpError(404, "해당 반품을 찾을 수 없습니다.")
    
    # 팩토리 권한 확인 (Project는 Quotation을 통해 Factory와 연결됨)
    quotation_exists = await sync_to_async(refund.project_log.project.quotations.filter(factory_id=int(factory_id)).exists)()
    if not quotation_exists:
        raise HttpError(404, "해당 반품을 찾을 수 없습니다.")
    
    return 200, {
        "id": refund.id,
        "product": {
            "id": refund.product.id,
            "name": refund.product.name,
            "code": refund.product.code,
            "current_stock": refund.product.current_stock
        },
        "project": {
            "id": refund.project_log.project.id,
            "status": refund.project_log.project.status
        },
        "amount": refund.amount,
        "current_stock": refund.current_stock,
        "production_amount": refund.production_amount,
        "refund_date": refund.refund_date.isoformat() if refund.refund_date else None,
        "log": {
            "id": refund.project_log.id,
            "title": refund.project_log.title,
            "content": refund.project_log.content,
            "created_at": refund.project_log.created_at.isoformat()
        },
        "created_at": refund.created_at.isoformat(),
        "updated_at": refund.updated_at.isoformat()
    }


@router.patch(
    "/{refund_id}",
    summary="[C] 반품 수정",
    description="반품 정보를 수정합니다. 반품 수량은 current_stock과 production_amount의 합으로 자동 계산됩니다.",
    response={200: RefundUpdateOut, 400: dict, 404: dict, 500: dict}
)
async def update_refund(request, refund_id: int, payload: RefundUpdateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        refund = await sync_to_async(Refund.objects.select_related('product', 'project_log').get)(id=refund_id)
    except Refund.DoesNotExist:
        raise HttpError(404, "해당 반품을 찾을 수 없습니다.")
    
    # 수정할 필드들을 업데이트
    update_fields = {}
    
    if payload.refund_date is not None:
        try:
            refund_date = datetime.strptime(payload.refund_date, "%Y-%m-%d").date()
            update_fields['refund_date'] = refund_date
        except ValueError:
            raise HttpError(400, "올바르지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 입력해주세요.")
    
    # current_stock은 수정 불가, 기존 값 사용
    current_stock = refund.current_stock
    production_amount = payload.production_amount if payload.production_amount is not None else refund.production_amount
    
    # 반품 수량 재계산
    new_refund_amount = current_stock + production_amount
    if new_refund_amount <= 0:
        raise HttpError(400, "반품 수량은 0보다 커야 합니다.")
    
    # 원래 반품 수량 저장 (ProjectPlan 비교용)
    original_refund_amount = refund.amount
    
    # 제품 변경 처리 (반품 업데이트 전에 실행)
    product_changed = False
    old_product = None
    if payload.product_id is not None:
        product_changed = payload.product_id != refund.product.id
        if product_changed:
            old_product = refund.product
            # 새로운 제품으로 업데이트
            try:
                new_product = await sync_to_async(Product.objects.get)(id=payload.product_id)
                update_fields['product'] = new_product
            except Product.DoesNotExist:
                raise HttpError(404, "해당 제품을 찾을 수 없습니다.")
    
    update_fields['amount'] = new_refund_amount
    update_fields['production_amount'] = production_amount
    
    # 반품 정보 업데이트
    for field, value in update_fields.items():
        setattr(refund, field, value)
    await sync_to_async(refund.save)()
    
    # 프로젝트 로그 내용도 업데이트
    log_content = f"{refund.product.name} {new_refund_amount}개가 반품되었어요."
    refund.project_log.content = log_content
    await sync_to_async(refund.project_log.save)()
    
    # 연결된 ProjectPlan이 있는지 확인하고 수정
    from project.models import ProjectPlan
    # project를 미리 가져와서 사용
    project = await sync_to_async(lambda: refund.project_log.project)()
    related_project_plans = await sync_to_async(list)(
        ProjectPlan.objects.filter(
            project=project,
            product__product=refund.product  # QuotationProduct의 product 필드
        )
    )
    
    updated_plans = []
    deleted_plans = []
    created_plans = []
    
    if product_changed:
        # 제품이 완전히 바뀐 경우: 기존 제품의 ProjectPlan 삭제
        old_product_plans = await sync_to_async(list)(
            ProjectPlan.objects.filter(
                project=project,
                product__product=old_product  # 기존 제품
            )
        )
        for plan in old_product_plans:
            if plan.quantity == original_refund_amount:
                plan_id = plan.id  # 삭제 전에 ID 저장
                await sync_to_async(plan.delete)()
                deleted_plans.append(plan_id)
        
        # 새로운 제품으로 ProjectPlan 생성 (생산 등록 로직과 동일)
        try:
            # 새로운 제품의 QuotationProduct 찾기
            new_quotation_product = await sync_to_async(
                QuotationProduct.objects.filter(
                    quotation__project=project,
                    product=update_fields.get('product', refund.product)  # 새로운 제품 또는 기존 제품
                ).first
            )()
            
            if new_quotation_product:
                # 기본 장비 선택
                default_equipment = await sync_to_async(FactoryEquipment.objects.filter(
                    factory_id=int(factory_id)
                ).order_by('priority').first)()
                
                if default_equipment:
                    # 새로운 ProjectPlan 생성
                    new_project_plan = await sync_to_async(ProjectPlan.objects.create)(
                        project=project,
                        product=new_quotation_product,
                        equipment=default_equipment,
                        status="가동 대기",
                        quantity=new_refund_amount,
                        start_date=datetime.now().date(),
                        end_date=datetime.now().date() + timedelta(days=7),
                        avg_production_time=3600
                    )
                    created_plans.append(new_project_plan.id)
        except Exception as e:
            # 새로운 제품의 QuotationProduct가 없는 경우 무시
            pass
    else:
        # 같은 제품인 경우: 수량만 수정
        for plan in related_project_plans:
            if plan.quantity == original_refund_amount:
                plan.quantity = new_refund_amount
                await sync_to_async(plan.save)()
                updated_plans.append(plan.id)
    
    return 200, {
        "message": "반품이 성공적으로 수정되었습니다.",
        "refund_id": refund.id,
        "updated_project_plans": updated_plans,
        "deleted_project_plans": deleted_plans,
        "created_project_plans": created_plans
    }