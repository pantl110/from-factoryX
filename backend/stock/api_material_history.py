from ninja import Router, Query
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth

from stock.models import Material, MaterialHistory
from stock.schemas.inbound import MaterialHistoryCreateIn, SingleMaterialHistoryCreateIn, MaterialHistoryDetailFilter
from stock.schemas.outbound import MaterialHistoryDetailOut, MaterialHistoryListOut
from factory.models import Factory, FactoryClient
from factory.utils import is_factory_member


router = Router(tags=["MaterialHistory"], auth=jwt_auth)


@router.post(
    "single", 
    summary="[C] 단일 원자재 이력 생성", 
    description="특정 원자재의 구매 또는 소모 이력을 생성합니다. 재고가 자동으로 업데이트됩니다.",
    response={ 200: MaterialHistoryDetailOut, 400: dict, 404: dict, 500: dict }
    )
async def create_single_material_history(request, payload: SingleMaterialHistoryCreateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        material = await Material.objects.aget(id=payload.material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")
    
    try:
        client = await FactoryClient.objects.aget(id=payload.client_id)
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "거래처 정보를 찾을 수 없습니다.")
    
    if payload.type not in ["purchase", "consumption"]:
        raise HttpError(400, "잘못된 거래 타입입니다. 'purchase' 또는 'consumption'을 입력해주세요.")
    
    if payload.type == "purchase" and payload.price is None:
        raise HttpError(400, "구매 시에는 가격을 입력해주세요.")
    
    current_stock = material.current_stock
    if payload.type == "purchase":
        new_stock = current_stock + payload.quantity
    else:
        new_stock = current_stock - payload.quantity
        if new_stock < 0:
            raise HttpError(400, "재고가 부족합니다.")
    
    material.current_stock = new_stock
    await sync_to_async(material.save)()
    
    type_mapping = {
        "purchase": MaterialHistory.MaterialHistoryType.purchase,
        "consumption": MaterialHistory.MaterialHistoryType.consumption
    }
    
    material_history = await MaterialHistory.objects.acreate(
        type=type_mapping[payload.type],
        material=material,
        client=client,
        quantity=payload.quantity,
        price=payload.price,
        total_stock=new_stock
    )
    
    return 200, MaterialHistoryDetailOut(
        id=material_history.id,
        type=material_history.type,
        material_id=material_history.material_id,
        client_id=material_history.client_id,
        quantity=material_history.quantity,
        price=material_history.price,
        total_stock=material_history.total_stock
    )


@router.post(
    "", 
    summary="[C] 원자재 이력 생성 (구매)", 
    description="거래처 명으로 기존 거래처가 있으면 정보를 업데이트 후 사용하고, 없으면 새로 생성합니다. 여러 원자재 구매 이력을 생성하며, 원자재가 없으면 새로 생성하고, 있으면 재고를 업데이트합니다.",
    response={ 200: MaterialHistoryListOut, 400: dict, 404: dict, 500: dict }
    )
async def create_material_history(request, payload: MaterialHistoryCreateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    factory = await Factory.objects.aget(id=int(factory_id))
    
    try:
        client = await FactoryClient.objects.aget(
            factory=factory,
            name=payload.client_info.name
        )
        updated = False
        for field in ["business_registration_number", "representative_name", "business_type", "business_category", "address"]:
            new_value = getattr(payload.client_info, field)
            if getattr(client, field) != new_value:
                setattr(client, field, new_value)
                updated = True
        if updated:
            await sync_to_async(client.save)()
    except FactoryClient.DoesNotExist:
        client = await FactoryClient.objects.acreate(
            factory=factory,
            name=payload.client_info.name,
            business_registration_number=payload.client_info.business_registration_number,
            representative_name=payload.client_info.representative_name,
            business_type=payload.client_info.business_type,
            business_category=payload.client_info.business_category,
            address=payload.client_info.address
        )
    
    material_histories = []
    
    for material_item in payload.materials:
        try:
            material = await Material.objects.aget(
                factory=factory, 
                code=material_item.code
            )
            current_stock = material.current_stock
            new_stock = current_stock + material_item.quantity
            
            material.current_stock = new_stock
            await sync_to_async(material.save)()
            
        except Material.DoesNotExist:
            material = await Material.objects.acreate(
                factory=factory,
                name=material_item.name,
                code=material_item.code,
                spec=material_item.spec,
                unit=material_item.unit,
                current_stock=material_item.quantity,
                standard_stock=0
            )
            new_stock = material_item.quantity
        
        material_history = await MaterialHistory.objects.acreate(
            type=MaterialHistory.MaterialHistoryType.purchase,
            material=material,
            client=client,
            quantity=material_item.quantity,
            price=material_item.price,
            total_stock=new_stock
        )
        
        material_histories.append(MaterialHistoryDetailOut(
            id=material_history.id,
            type=material_history.type,
            material_id=material_history.material_id,
            client_id=material_history.client_id,
            quantity=material_history.quantity,
            price=material_history.price,
            total_stock=material_history.total_stock
        ))
    
    return 200, MaterialHistoryListOut(materials=material_histories)


# Material Tab
@router.get(
    "",
    summary="[C] 원자재 히스토리 조회", 
    description="특정 원자재의 히스토리를 조회합니다. 기간 설정이 없으면 전체 히스토리를, 기간 설정이 있으면 해당 기간의 히스토리를 조회합니다.",
    response={ 200: dict, 404: dict, 500: dict }
    )
async def get_material_history(request, material_id: int, filters: MaterialHistoryDetailFilter = Query(...), page: int = 1, page_size: int = 5):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")
    
    @sync_to_async
    def get_histories():
        queryset = MaterialHistory.objects.filter(material=material)
        # type 파라미터 영어→한글 변환 지원
        type_param = request.GET.get("type")
        type_map = {"purchase": "구매", "consumption": "소모"}
        if type_param in type_map:
            queryset = queryset.filter(type=type_map[type_param])
        elif type_param:
            queryset = queryset.filter(type=type_param)
        queryset = filters.filter(queryset)
        
        total_count = queryset.count()
        
        offset = (page - 1) * page_size
        histories = list(queryset.order_by('-created_at')[offset:offset + page_size])
        
        history_list = []
        for history in histories:
            client_name = history.client.name if history.client else None
            history_list.append({
                "id": history.id,
                "type": history.type,
                "client_id": history.client_id,
                "client_name": client_name,
                "quantity": history.quantity,
                "unit_price": history.price,
                "amount": (history.quantity or 0) * (history.price or 0),
                "date": history.created_at.isoformat() if history.created_at else None,
                "total_stock": history.total_stock,
                "purchase_tax_invoice_id": history.purchase_tax_invoice_id,
                "cash_receipt_id": history.cash_receipt_id,
            })
        
        total_pages = (total_count + page_size - 1) // page_size
        next_page = page + 1 if page < total_pages else None
        previous_page = page - 1 if page > 1 else None
        
        return {
            "data": history_list,
            "count": len(history_list),
            "totalCnt": total_count,
            "pageCnt": total_pages,
            "curPage": page,
            "nextPage": next_page,
            "previousPage": previous_page
        }
    
    return await get_histories()