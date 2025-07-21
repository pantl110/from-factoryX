from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from document.models import Quotation, QuotationProduct
from stock.models import Product

from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from factory.models import FactoryClient
from document.schemas.outbound import QuotationProductOut, QuotationDraftOut, QuotationProductionOut, QuotationProductHistoryListOut
from document.schemas.inbound import QuotationDraftIn, QuotationProductionIn
from ninja import Query
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from django.db import transaction
from django.db.models import Q
from asgiref.sync import sync_to_async
from typing import List, Optional
from datetime import datetime, date, timedelta

from document.models import Quotation, QuotationProduct
from factory.models import Factory, FactoryClient, FactoryEquipment
from stock.models import Product
from project.models import Project, ProjectPlan

router = Router(tags=["QuotationProduct"], auth=jwt_auth)

# Quotation Tab
# 생산 시작 또는 임시 저장 버튼을 누름과 함께 Quotation Product 업데이트

    

@router.get("/", summary="[C] 견적서 품목 목록 조회", response={200: list, 400: dict, 404: dict, 500: dict})
async def list_quotation_products(request, quotation_id: int = Query(None), factory_id: int = Query(None)):
    if quotation_id is None and factory_id is None:
        raise HttpError(400, "quotation_id 또는 factory_id를 입력해야 합니다.")
    try:
        if quotation_id:
            qps = await sync_to_async(list)(QuotationProduct.objects.filter(quotation_id=quotation_id))
        elif factory_id:
            qps = await sync_to_async(list)(QuotationProduct.objects.filter(quotation__factory_id=factory_id))
    except Exception as e:
        raise HttpError(500, f"조회 중 오류: {str(e)}")
    if not qps:
        raise HttpError(404, "품목이 없습니다.")
    return 200, [
        {
            "id": qp.id,
            "quotation": qp.quotation_id,
            "product": qp.product_id,
            "quantity": qp.quantity,
            "unit_price": qp.unit_price,
            "is_delivery": qp.is_delivery,
            "delivery_date": qp.delivery_date.isoformat() if qp.delivery_date else None
        } for qp in qps
    ]

@router.get("/{id}", summary="[C] 견적서 품목 상세 조회", response={200: QuotationProductOut, 404: dict, 500: dict})
async def get_quotation_product_detail(request, id: int):
    try:
        qp = await QuotationProduct.objects.aget(id=id)
    except QuotationProduct.DoesNotExist:
        raise HttpError(404, "해당 품목을 찾을 수 없습니다.")
    except Exception as e:
        raise HttpError(500, f"조회 중 오류: {str(e)}")
    return 200, {
        "id": qp.id,
        "quotation": qp.quotation_id,
        "product": qp.product_id,
        "quantity": qp.quantity,
        "unit_price": qp.unit_price,
        "is_delivery": qp.is_delivery,
        "delivery_date": qp.delivery_date.isoformat() if qp.delivery_date else None
    }
    

# Quotation Tab
@router.get(
    "/history/list",
    summary="[C] 견적서 품목 히스토리 조회",
    description="이전에 생산하였던 Quotation Product 항목을 조회합니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict}
)
async def list_history_quotation_product(request):
    """
    입력 필드:
    - product_ids: Product ID 리스트 (콤마로 구분된 문자열)
    
    반환 필드:
    - product_name: 품목 정보 (제품명)
    - quantity: 제작 수량
    - unit_price: 단가
    - total_amount: 금액 (수량 * 단가)
    """ 
    product_ids = request.GET.get('product_ids')
    if not product_ids:
        raise HttpError(400, "product_ids를 입력해야 합니다.")
    
    try:
        product_id_list = [int(pid.strip()) for pid in product_ids.split(',') if pid.strip()]
        
        if not product_id_list:
            raise HttpError(400, "product_ids를 입력해야 합니다.")
        
        qps = await sync_to_async(list)(
            QuotationProduct.objects.select_related('product')
            .filter(product__id__in=product_id_list)
            .order_by('-created_at')
        )
        
        if not qps:
            raise HttpError(404, "해당 제품의 견적 내역이 없습니다.")
        
        results = []
        for qp in qps:
            results.append({
                "product_name": qp.product.name,
                "quantity": qp.quantity,
                "unit_price": qp.unit_price,
                "total_amount": qp.quantity * qp.unit_price
            })
        
        return 200, {"results": results}
        
    except ValueError:
        raise HttpError(400, "product_ids는 콤마로 구분된 정수여야 합니다.")
    except Exception as e:
        raise HttpError(500, f"조회 중 오류: {str(e)}")



@router.post("/draft", summary="견적서 임시 저장", description="견적서를 임시로 저장합니다. 필수 필드가 비어있어도 저장됩니다.")
async def save_draft_quotation(request, payload: QuotationDraftIn):
    """견적서 임시 저장 API"""
    try:
        # 견적서 존재 확인
        quotation = await sync_to_async(get_object_or_404)(Quotation, id=payload.quotation_id)
        
        # 클라이언트 정보 업데이트 (있는 경우에만)
        if payload.client:
            client_data = payload.client
            client, created = await FactoryClient.objects.aget_or_create(
                factory=quotation.factory,
                name=client_data.get("name", ""),
                defaults={
                    "business_registration_number": client_data.get("business_registration_number"),
                    "representative_name": client_data.get("representative_name"),
                    "business_type": client_data.get("business_type"),
                    "business_category": client_data.get("business_category"),
                    "address": client_data.get("address"),
                    "email": client_data.get("email"),
                    "phone": client_data.get("phone"),
                    "fax": client_data.get("fax"),
                }
            )
            quotation.client = client
        
        # 납기일자 업데이트 (있는 경우에만)
        if payload.due_date:
            quotation.due_date = datetime.strptime(payload.due_date, "%Y-%m-%d").date()
        
        await sync_to_async(quotation.save)()
        
        # 품목 정보 업데이트 (있는 경우에만)
        if payload.products:
            # 기존 품목들 삭제
            await QuotationProduct.objects.filter(quotation=quotation).adelete()
            
            # 새 품목들 생성
            for prod in payload.products:
                product = await sync_to_async(get_object_or_404)(Product, id=prod["id"])
                await QuotationProduct.objects.acreate(
                    quotation=quotation,
                    product=product,
                    quantity=prod["quantity"],
                    unit_price=prod["unit_price"]
                )
            
            return 200, {"quotation_id": quotation.id, "status": "draft_saved"}
            
    except Exception as e:
        raise HttpError(500, f"임시 저장 중 오류가 발생했습니다: {str(e)}")


@router.post("/production", summary="생산 시작", description="완성된 견적서로 생산을 시작합니다. 모든 필수 정보가 필요합니다.")
async def start_production(request, payload: QuotationProductionIn):
    """생산 시작 API"""
    try:
        # 견적서 존재 확인
        quotation = await sync_to_async(get_object_or_404)(Quotation, id=payload.quotation_id)
        
        # 필수 정보 검증
        if not payload.client:
            raise HttpError(400, "클라이언트 정보는 필수입니다.")
        
        if not payload.products:
            raise HttpError(400, "품목 정보는 필수입니다.")
        
        if not payload.due_date:
            raise HttpError(400, "납기일자는 필수입니다.")
        
        if not payload.production_plans:
            raise HttpError(400, "생산 계획은 필수입니다.")
        
        # 1. 클라이언트 정보 업데이트
        client_data = payload.client
        client, created = await FactoryClient.objects.aget_or_create(
            factory=quotation.factory,
            name=client_data["name"],
            defaults={
                "business_registration_number": client_data.get("business_registration_number"),
                "representative_name": client_data.get("representative_name"),
                "business_type": client_data.get("business_type"),
                "business_category": client_data.get("business_category"),
                "address": client_data.get("address"),
                "email": client_data.get("email"),
                "phone": client_data.get("phone"),
                "fax": client_data.get("fax"),
            }
        )
        quotation.client = client
        
        # 2. 납기일자 설정
        quotation.due_date = datetime.strptime(payload.due_date, "%Y-%m-%d").date()
        await sync_to_async(quotation.save)()
        
        # 3. 품목 정보 업데이트
        await QuotationProduct.objects.filter(quotation=quotation).adelete()
        
        for prod in payload.products:
            product = await sync_to_async(get_object_or_404)(Product, id=prod["id"])
            quotation_product = await QuotationProduct.objects.acreate(
                quotation=quotation,
                product=product,
                quantity=prod["quantity"],
                unit_price=prod["unit_price"]
            )
        
        # 4. 프로젝트 상태 변경
        project = quotation.project
        project.status = Project.ProjectStatus.pending
        await sync_to_async(project.save)()
        
        # 5. 생산 계획 생성 (품목만 연결된 빈 플랜)
        for plan_data in payload.production_plans:
            # 해당 품목 찾기
            quotation_product = await QuotationProduct.objects.aget(
                quotation=quotation,
                product_id=plan_data.product_id
            )
            
            # 기본값 설정
            equipment = None
            if plan_data.equipment_id:
                equipment = await sync_to_async(get_object_or_404)(
                    FactoryEquipment, 
                    id=plan_data.equipment_id
                )
            
            quantity = plan_data.quantity or quotation_product.quantity
            start_date = plan_data.start_date or datetime.now().strftime("%Y-%m-%d")
            end_date = plan_data.end_date or (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            avg_production_time = plan_data.avg_production_time or 3600  # 기본 1시간
            
            # 생산 계획 생성
            await ProjectPlan.objects.acreate(
                project=project,
                product=quotation_product,
                quantity=quantity,
                equipment=equipment,
                start_date=datetime.strptime(start_date, "%Y-%m-%d").date(),
                end_date=datetime.strptime(end_date, "%Y-%m-%d").date(),
                avg_production_time=avg_production_time
            )
            
            return {
                "quotation_id": quotation.id,
                "project_id": project.id,
                "status": "production_started"
            }
            
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"생산 시작 중 오류가 발생했습니다: {str(e)}")
