from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from project.models import Project, ProjectLog, Refund
from project.schemas.outbound import RefundCreateIn, RefundCreateOut, RefundUpdateIn, RefundUpdateOut
from stock.models import Product
from datetime import datetime

router = Router(tags=["ProjectRefund"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 반품 생성",
    description="반품을 생성하고 관련 로그를 기록합니다.",
    response={200: RefundCreateOut, 400: dict, 404: dict, 500: dict}
)
async def create_refund(request, payload: RefundCreateIn):
    try:
        project = await Project.objects.aget(id=payload.project_id)
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")
    
    try:
        product = await Product.objects.aget(id=payload.product_id)
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품을 찾을 수 없습니다.")
    
    refund_amount = payload.current_stock + payload.production_amount
    
    if refund_amount <= 0:
        raise HttpError(400, "반품 수량은 0보다 커야 합니다.")
    
    try:
        refund_date = datetime.strptime(payload.refund_date, "%Y-%m-%d").date()
    except ValueError:
        raise HttpError(400, "올바르지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 입력해주세요.")
    
    log = await ProjectLog.objects.acreate(
        project=project,
        type=ProjectLog.LogType.refund,
        title="반품 접수 현황",
        content=f"{product.name} {refund_amount}개가 반품되었어요."
    )
    
    # Refund 생성
    refund = await Refund.objects.acreate(
        project_log=log,
        product=product,
        amount=refund_amount,
        refund_date=refund_date,
        current_stock=payload.current_stock,
        production_amount=payload.production_amount
    )
    
    return 200, {
        "message": "반품이 성공적으로 생성되었습니다.",
        "refund_id": refund.id,
        "log_id": log.id
    }


@router.patch(
    "/{refund_id}",
    summary="[C] 반품 수정",
    description="반품 정보를 수정합니다. 반품 수량은 current_stock과 production_amount의 합으로 자동 계산됩니다.",
    response={200: RefundUpdateOut, 400: dict, 404: dict, 500: dict}
)
async def update_refund(request, refund_id: int, payload: RefundUpdateIn):
    try:
        refund = await Refund.objects.aget(id=refund_id)
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
    
    if payload.current_stock is not None:
        update_fields['current_stock'] = payload.current_stock
    
    if payload.production_amount is not None:
        update_fields['production_amount'] = payload.production_amount
    
    # current_stock과 production_amount가 모두 업데이트되는 경우 반품 수량 재계산
    if 'current_stock' in update_fields or 'production_amount' in update_fields:
        new_current_stock = update_fields.get('current_stock', refund.current_stock)
        new_production_amount = update_fields.get('production_amount', refund.production_amount)
        
        new_refund_amount = new_current_stock + new_production_amount
        
        if new_refund_amount <= 0:
            raise HttpError(400, "반품 수량은 0보다 커야 합니다.")
        
        update_fields['amount'] = new_refund_amount
    
    # 반품 정보 업데이트
    for field, value in update_fields.items():
        setattr(refund, field, value)
    
    await refund.asave()
    
    # 프로젝트 로그 내용도 업데이트
    if 'amount' in update_fields:
        log_content = f"{refund.product.name} {new_refund_amount}개가 반품되었어요."
        refund.project_log.content = log_content
        await refund.project_log.asave()
    
    return 200, {
        "message": "반품이 성공적으로 수정되었습니다.",
        "refund_id": refund.id
    }
