from api.security import jwt_auth
from ninja import Router, Query
from ninja.errors import HttpError
from django.http import Http404
from django.shortcuts import get_object_or_404
from asgiref.sync import sync_to_async
from datetime import datetime, timedelta

from document.models import Quotation, QuotationProduct
from document.schemas.inbound import QuotationDraftIn, QuotationConfirmedIn
from document.schemas.outbound import QuotationProductOut
from stock.models import Product
from project.models import Project, ProjectPlan
from factory.models import FactoryClient, FactoryEquipment
from factory.utils import is_factory_member


router = Router(tags=["QuotationProduct"], auth=jwt_auth)


@router.post("/draft", summary="견적서 임시 저장", description="견적서를 임시로 저장합니다. 필수 필드가 비어있어도 저장됩니다.")
async def save_draft_quotation(request, payload: QuotationDraftIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        try:
            quotation = await sync_to_async(get_object_or_404)(Quotation, id=payload.quotation_id)
        except Http404:
            raise HttpError(404, "해당 견적서를 찾을 수 없습니다.")
        
        if quotation.factory_id != int(factory_id):
            raise HttpError(403, "해당 공장의 견적서가 아닙니다.")
        
        if payload.client:
            client_data = payload.client
            factory = await sync_to_async(lambda: quotation.factory)()
            client, created = await FactoryClient.objects.aget_or_create(
                factory=factory,
                name=client_data.name,
                defaults={
                    "business_registration_number": client_data.business_registration_number,
                    "representative_name": client_data.representative_name,
                    "business_type": client_data.business_type,
                    "business_category": client_data.business_category,
                    "address": client_data.address,
                    "manager": client_data.manager,
                    "email": client_data.email,
                    "phone": client_data.phone,
                    "fax": client_data.fax,
                }
            )
            quotation.client = client
        
        if payload.due_date:
            quotation.due_date = datetime.strptime(payload.due_date, "%Y-%m-%d").date()
        
        await sync_to_async(quotation.save)()
        
        project = await sync_to_async(lambda: quotation.project)()
        project.status = Project.ProjectStatus.quotation
        await sync_to_async(project.save)()
        
        if payload.products is not None:
            await QuotationProduct.objects.filter(quotation=quotation).adelete()
            
            if payload.products:
                for prod in payload.products:
                    try:
                        product = await sync_to_async(get_object_or_404)(Product, id=prod.product_id)
                    except Http404:
                        raise HttpError(404, "해당 제품을 찾을 수 없습니다.")
                    await QuotationProduct.objects.acreate(
                        quotation=quotation,
                        product=product,
                        quantity=prod.quantity,
                        unit_price=prod.unit_price,
                        is_delivery=prod.is_delivery,
                        delivery_date=datetime.strptime(prod.delivery_date, "%Y-%m-%d").date() if prod.delivery_date else None
                    )
        
        return 200, {"quotation_id": quotation.id, "status": "draft_saved"}
            
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"임시 저장 중 오류가 발생했습니다: {str(e)}")


@router.post("/confirmed", summary="생산 시작", description="완성된 견적서로 생산을 시작합니다. 모든 필수 정보가 필요합니다.")
async def confirm_order(request, payload: QuotationConfirmedIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    try:
        try:
            quotation = await sync_to_async(get_object_or_404)(Quotation, id=payload.quotation_id)
        except Http404:
            raise HttpError(404, "해당 견적서를 찾을 수 없습니다.")
        
        if not payload.quotation_id:
            raise HttpError(400, "견적서 ID는 필수입니다.")
        
        if not payload.client:
            raise HttpError(400, "클라이언트 정보는 필수입니다.")
        
        if not payload.products:
            raise HttpError(400, "품목 정보는 필수입니다.")
        
        client_data = payload.client
        factory = await sync_to_async(lambda: quotation.factory)()
        client, created = await FactoryClient.objects.aget_or_create(
            factory=factory,
            name=client_data.name,
            defaults={
                "business_registration_number": client_data.business_registration_number,
                "representative_name": client_data.representative_name,
                "business_type": client_data.business_type,
                "business_category": client_data.business_category,
                "address": client_data.address,
                "email": client_data.email,
                "phone": client_data.phone,
                "fax": client_data.fax,
            }
        )
        quotation.client = client
        
        if payload.due_date:
            quotation.due_date = datetime.strptime(payload.due_date, "%Y-%m-%d").date()
            await sync_to_async(quotation.save)()
        
        await QuotationProduct.objects.filter(quotation=quotation).adelete()
        
        for prod in payload.products:
                try:
                    product_id = prod.product_id
                    if not product_id:
                        raise HttpError(400, "제품 ID는 필수입니다.")
                    
                    product = await sync_to_async(get_object_or_404)(Product, id=product_id)
                except Http404:
                    raise HttpError(404, "해당 제품을 찾을 수 없습니다.")
                quotation_product = await QuotationProduct.objects.acreate(
                    quotation=quotation,
                    product=product,
                    quantity=prod.quantity,
                    unit_price=prod.unit_price
                )
        
        project = await sync_to_async(lambda: quotation.project)()
        project.status = Project.ProjectStatus.production
        await sync_to_async(project.save)()
        
        for prod in payload.products:
            try:
                product_id = prod.product_id
                quotation_product = await QuotationProduct.objects.aget(
                    quotation=quotation,
                    product_id=product_id
                )
            except QuotationProduct.DoesNotExist:
                raise HttpError(404, f"제품 ID {product_id}에 해당하는 견적 품목을 찾을 수 없습니다.")
            
            try:
                equipment = await FactoryEquipment.objects.filter(
                    factory=factory,
                    status=FactoryEquipment.EquipmentStatus.standby
                ).order_by('priority').afirst()
                if not equipment:
                    raise HttpError(400, "해당 공장에 가동 가능한 설비가 없습니다.")
            except Exception as e:
                raise HttpError(400, f"설비 조회 중 오류가 발생했습니다: {str(e)}")
            
            product = await sync_to_async(lambda: quotation_product.product)()
            buffer_rate = float(product.buffer_rate)
            base_quantity = prod.quantity
            production_quantity = int(base_quantity * (1 + buffer_rate))
            
            start_date = datetime.now().strftime("%Y-%m-%d") 
            end_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            avg_production_time = 3600
            
            await ProjectPlan.objects.acreate(
                project=project,
                product=quotation_product,
                quantity=production_quantity,
                equipment=equipment,
                start_date=datetime.strptime(start_date, "%Y-%m-%d").date(),
                end_date=datetime.strptime(end_date, "%Y-%m-%d").date(),
                avg_production_time=avg_production_time
            )
        
        return 200, {
            "quotation_id": quotation.id,
            "project_id": project.id,
            "status": "production_started"
        }
            
    except HttpError:
        raise
    except Exception as e:
        print(f"[CONFIRMATION ERROR] {str(e)}")
        raise HttpError(500, f"주문 확정 중 오류가 발생했습니다: {str(e)}")


# Quotation Tab
@router.get("/", summary="[C] 견적서 품목 목록 조회", response={200: list, 400: dict, 404: dict, 500: dict})
async def list_quotation_products(request, quotation_id: int = Query(None)):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    try:
        if quotation_id:
            qps = await sync_to_async(list)(QuotationProduct.objects.filter(
                quotation_id=quotation_id,
                quotation__factory_id=int(factory_id)
            ))
        else:
            qps = await sync_to_async(list)(QuotationProduct.objects.filter(quotation__factory_id=int(factory_id)))
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


@router.get("/{quotation_product_id}", summary="[C] 견적서 품목 상세 조회", response={200: QuotationProductOut, 404: dict, 500: dict})
async def get_quotation_product_detail(request, quotation_product_id: int):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    try:
        qp = await QuotationProduct.objects.aget(id=quotation_product_id)
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
    "/history",
    summary="[C] 견적서 품목 히스토리 조회",
    description="이전에 생산하였던 Quotation Product 항목을 조회합니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict}
)
async def list_history_quotation_product(request):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
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
