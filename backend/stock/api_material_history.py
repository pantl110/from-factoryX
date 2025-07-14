from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from stock.schemas.inbound import MaterialHistoryCreateIn, SingleMaterialHistoryCreateIn
from stock.schemas.outbound import MaterialHistoryDetailOut, MaterialHistoryListOut
from stock.models import Material, MaterialHistory
from factory.models import Factory, FactoryClient

router = Router(tags=["MaterialHistory"], auth=jwt_auth)


@router.post(
    "", 
    summary="[C] 원자재 이력 생성 (구매)", 
    description="거래처를 생성하고 여러 원자재 구매 이력을 생성합니다. 원자재가 없으면 새로 생성하고, 있으면 재고를 업데이트합니다.",
    response={ 200: MaterialHistoryListOut, 400: dict, 404: dict, 500: dict }
    )
async def create_material_history(request, payload: MaterialHistoryCreateIn):
    try:
        factory = await Factory.objects.aget(id=payload.factory)
    except Factory.DoesNotExist:
        raise HttpError(404, "공장 정보를 찾을 수 없습니다.")
    
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
    """단일 원자재 히스토리 생성 API"""
    
    # 원자재 조회
    try:
        material = await Material.objects.aget(id=payload.material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")
    
    # 거래처 조회
    try:
        client = await FactoryClient.objects.aget(id=payload.client_id)
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "거래처 정보를 찾을 수 없습니다.")
    
    # 거래 타입 검증
    if payload.type not in [MaterialHistory.MaterialHistoryType.purchase, MaterialHistory.MaterialHistoryType.consumption]:
        raise HttpError(400, "잘못된 거래 타입입니다. 'purchase' 또는 'consumption'을 입력해주세요.")
    
    # 구매 시 가격 필수
    if payload.type == MaterialHistory.MaterialHistoryType.purchase and payload.price is None:
        raise HttpError(400, "구매 시에는 가격을 입력해주세요.")
    
    # 재고 계산
    current_stock = material.current_stock
    if payload.type == MaterialHistory.MaterialHistoryType.purchase:
        new_stock = current_stock + payload.quantity
    else:  # consumption
        new_stock = current_stock - payload.quantity
        if new_stock < 0:
            raise HttpError(400, "재고가 부족합니다.")
    
    # 재고 업데이트
    material.current_stock = new_stock
    await sync_to_async(material.save)()
    
    # 히스토리 생성
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


@router.get(
    "{material_id}",
    summary="[C] 원자재 전체 히스토리 조회", 
    description="특정 원자재의 모든 히스토리를 조회합니다.",
    response={ 200: list[MaterialHistoryDetailOut], 404: dict, 500: dict }
    )
async def get_material_history(request, material_id: int):
    """원자재 전체 히스토리 조회 API"""
    
    # 원자재 조회
    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")
    
    # 히스토리 조회 (최신순)
    histories = await sync_to_async(list)(
        MaterialHistory.objects.filter(material=material).order_by('-created_at')
    )
    
    history_list = []
    for history in histories:
        history_list.append(MaterialHistoryDetailOut(
            id=history.id,
            type=history.type,
            material_id=history.material_id,
            client_id=history.client_id,
            quantity=history.quantity,
            price=history.price,
            total_stock=history.total_stock
        ))
    
    return 200, history_list


@router.get(
    "{material_id}/period",
    summary="[C] 원자재 기간별 히스토리 조회", 
    description="특정 원자재의 최근 N개월 또는 N일 히스토리를 조회합니다.",
    response={ 200: list[MaterialHistoryDetailOut], 404: dict, 500: dict }
    )
async def get_material_history_by_period(request, material_id: int, months: int = None, days: int = None):
    """원자재 기간별 히스토리 조회 API"""
    
    # 원자재 조회
    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")
    
    # 기간 계산
    from django.utils import timezone
    from datetime import timedelta
    
    if days is not None:
        # 일 단위로 계산
        start_date = timezone.now() - timedelta(days=days)
    elif months is not None:
        # 월 단위로 계산 (기본값: 3개월)
        start_date = timezone.now() - timedelta(days=months * 30)
    else:
        # 기본값: 3개월
        start_date = timezone.now() - timedelta(days=3 * 30)
    
    # 히스토리 조회 (최신순, 기간 제한)
    histories = await sync_to_async(list)(
        MaterialHistory.objects.filter(
            material=material,
            created_at__gte=start_date
        ).order_by('-created_at')
    )
    
    history_list = []
    for history in histories:
        history_list.append(MaterialHistoryDetailOut(
            id=history.id,
            type=history.type,
            material_id=history.material_id,
            client_id=history.client_id,
            quantity=history.quantity,
            price=history.price,
            total_stock=history.total_stock
        ))
    
    return 200, history_list


