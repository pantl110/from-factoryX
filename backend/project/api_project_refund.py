from ninja import Router, Query
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from datetime import datetime
from typing import List
from api.security import jwt_auth

from project.models import Project, ProjectLog, Refund
from project.schemas.outbound import RefundCreateOut, RefundUpdateOut, RefundListOut, RefundDetailOut
from project.schemas.inbound import RefundCreateIn, RefundUpdateIn
from stock.models import Product
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
    
    return 200, {
        "message": "반품이 성공적으로 수정되었습니다.",
        "refund_id": refund.id
    }