from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from stock.schemas.inbound import MaterialHistoryCreateIn, SingleMaterialHistoryCreateIn
from stock.schemas.outbound import MaterialHistoryDetailOut, MaterialHistoryListOut, MaterialHistoryDetailResponseOut
from stock.models import Material, MaterialHistory
from factory.models import Factory, FactoryClient
from ninja import FilterSchema, Query
from stock.schemas.inbound import MaterialHistoryDetailFilter

router = Router(tags=["MaterialHistory"], auth=jwt_auth)


@router.post(
    "", 
    summary="[C] 원자재 이력 생성 (구매)", 
    description="거래처 명으로 기존 거래처가 있으면 정보를 업데이트 후 사용하고, 없으면 새로 생성합니다. 여러 원자재 구매 이력을 생성하며, 원자재가 없으면 새로 생성하고, 있으면 재고를 업데이트합니다.",
    response={ 200: MaterialHistoryListOut, 400: dict, 404: dict, 500: dict }
    )
async def create_material_history(request, payload: MaterialHistoryCreateIn):
    try:
        factory = await Factory.objects.aget(id=payload.factory)
    except Factory.DoesNotExist:
        raise HttpError(404, "공장 정보를 찾을 수 없습니다.")
    
    # 거래처 명으로 기존 거래처 조회 및 업데이트
    try:
        client = await FactoryClient.objects.aget(
            factory=factory,
            name=payload.client_info.name
        )
        # 입력값과 기존 거래처 정보가 다르면 업데이트
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


@router.post(
    "single", 
    summary="[C] 단일 원자재 이력 생성", 
    description="특정 원자재의 구매 또는 소모 이력을 생성합니다. 재고가 자동으로 업데이트됩니다.",
    response={ 200: MaterialHistoryDetailOut, 400: dict, 404: dict, 500: dict }
    )
async def create_single_material_history(request, payload: SingleMaterialHistoryCreateIn):
    try:
        material = await Material.objects.aget(id=payload.material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")
    
    try:
        client = await FactoryClient.objects.aget(id=payload.client_id)
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "거래처 정보를 찾을 수 없습니다.")
    
    if payload.type not in [MaterialHistory.MaterialHistoryType.purchase, MaterialHistory.MaterialHistoryType.consumption]:
        raise HttpError(400, "잘못된 거래 타입입니다. 'purchase' 또는 'consumption'을 입력해주세요.")
    
    if payload.type == MaterialHistory.MaterialHistoryType.purchase and payload.price is None:
        raise HttpError(400, "구매 시에는 가격을 입력해주세요.")
    
    current_stock = material.current_stock
    if payload.type == MaterialHistory.MaterialHistoryType.purchase:
        new_stock = current_stock + payload.quantity
    else:
        new_stock = current_stock - payload.quantity
        if new_stock < 0:
            raise HttpError(400, "재고가 부족합니다.")
    
    material.current_stock = new_stock
    await sync_to_async(material.save)()
    
    material_history = await MaterialHistory.objects.acreate(
        type=payload.type,
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


# Material Tab
@router.get(
    "",
    summary="[C] 원자재 히스토리 조회", 
    description="특정 원자재의 히스토리를 조회합니다. 기간 설정이 없으면 전체 히스토리를, 기간 설정이 있으면 해당 기간의 히스토리를 조회합니다.",
    response={ 200: list[dict], 404: dict, 500: dict }
    )
@paginate
async def get_material_history(request, material_id: int, months: int = None, days: int = None):
    """
    입력 필드:
    - material_id: 원자재 ID (쿼리 파라미터, 필수)
    - months: 최근 N개월 이력만 조회 (선택)
    - days: 최근 N일 이력만 조회 (선택)

    반환 필드 (dict 리스트):
    - id: 이력 ID (int)
    - type: 입고/출고 타입 (str)
    - client_name: 거래처명 (str)
    - quantity: 수량 (int)
    - unit_price: 단가 (int)
    - amount: 금액(수량x단가) (int)
    - date: 거래일자 (str, ISO8601)
    """
    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")

    factory_owner = await sync_to_async(lambda m: m.factory.owner)(material)
    if factory_owner != request.auth:
        raise HttpError(403, "권한이 없습니다.")

    from django.utils import timezone
    from datetime import timedelta
    
    @sync_to_async
    def get_histories():
        queryset = MaterialHistory.objects.filter(material=material)
        if days is not None or months is not None:
            if days is not None:
                start_date = timezone.now() - timedelta(days=days)
            elif months is not None:
                start_date = timezone.now() - timedelta(days=months * 30)
            queryset = queryset.filter(created_at__gte=start_date)
        return list(queryset.order_by('-created_at'))
    
    histories = await get_histories()
    
    history_list = []
    for history in histories:
        client_name = await sync_to_async(lambda h: h.client.name if h.client else None)(history)
        history_list.append({
            "id": history.id,
            "type": history.type,
            "client_name": client_name,
            "quantity": history.quantity,
            "unit_price": history.price,
            "amount": (history.quantity or 0) * (history.price or 0),
            "date": history.created_at.isoformat() if history.created_at else None
        })
    
    return history_list


@router.get(
    "/detail",
    summary="[C] 원자재 이력 상세 조회",
    description="material_id, 기간 필터로 처리일자, 상태, 수량, 현재 재고, 매입계산서/현금영수증 연결 유무(id/null) 반환",
    response={200: list[MaterialHistoryDetailResponseOut], 404: dict}
)
@paginate
async def get_material_history_detail(request, material_id: int, filters: MaterialHistoryDetailFilter = Query(...)):
    """
    입력 필드(쿼리 파라미터):
    - material_id: 원자재 ID (필수)
    - start_date: 조회 시작일 (YYYY-MM-DD, 선택)
    - end_date: 조회 종료일 (YYYY-MM-DD, 선택)

    반환 필드(각 이력별 dict):
    - id: 이력 ID (int)
    - date: 처리일자 (str, ISO8601)
    - type: 상태 (str, purchase=구매, consumption=소모)
    - quantity: 수량 (int)
    - total_stock: 이력 반영 후 현재 재고 (int)
    - purchase_tax_invoice_id: 매입 세금계산서 연결 ID (int/null)
    - cash_receipt_id: 현금영수증 연결 ID (int/null)
    """
    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")
    queryset = MaterialHistory.objects.filter(material=material)
    if filters.start_date:
        queryset = queryset.filter(created_at__gte=filters.start_date)
    if filters.end_date:
        queryset = queryset.filter(created_at__lte=filters.end_date)
    queryset = queryset.order_by("-created_at")
    from asgiref.sync import sync_to_async
    result = []
    for h in await sync_to_async(list)(queryset):
        result.append(MaterialHistoryDetailResponseOut(
            id=h.id,
            date=h.created_at.isoformat() if h.created_at else None,
            type=h.type,
            quantity=h.quantity,
            total_stock=h.total_stock,
            purchase_tax_invoice_id=h.purchase_tax_invoice_id,
            cash_receipt_id=h.cash_receipt_id,
        ))
    return result


