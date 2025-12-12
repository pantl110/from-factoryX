from ninja.errors import HttpError
from stock.models import Product, ProductHistory, Material, MaterialHistory
from factory.models import Factory
from django.utils import timezone
from datetime import timedelta
from repackaging.models import MaterialRepackaging


async def verify_factory_ownership(factory_id: int, user=None):
    """공장 소유권을 검증합니다."""
    try:
        await Factory.objects.aget(id=factory_id, owner=user)
        return True
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않거나 접근 권한이 없습니다.")


async def get_product_by_id(product_id: int, factory_id: int):
    try:
        product = await Product.objects.select_related("factory").aget(
            id=product_id, factory_id=factory_id
        )
        return product
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품이 존재하지 않습니다.")


def get_product_list_by_ids(product_ids: list, factory_id: int):
    """제품 ID 리스트로 제품들을 조회합니다."""
    if not product_ids:
        return []

    products = Product.objects.prefetch_related("location").filter(
        id__in=product_ids, factory_id=factory_id
    )

    return products


async def get_history_by_id(history_id: int, user=None):
    try:
        product_history = await ProductHistory.objects.aget(
            id=history_id, product__factory__owner=user
        )
        return product_history
    except ProductHistory.DoesNotExist:
        raise HttpError(404, "해당 입출고 이력이 존재하지 않습니다.")
    

async def get_material_by_id(material_id: int, factory_id: int):
    """원자재 ID로 원자재를 조회합니다."""
    try:
        material = await Material.objects.aget(
            id=material_id, factory_id=factory_id
        )
        return material
    except Material.DoesNotExist:
        raise HttpError(404, "해당 원자재가 존재하지 않습니다.")


async def get_material_by_id_with_ownership(material_id: int, factory_id: int, user=None):
    """원자재 ID로 원자재를 조회하고 공장 소유권을 검증합니다."""
    try:
        material = await Material.objects.aget(
            id=material_id, factory_id=factory_id, factory__owner=user
        )
        return material
    except Material.DoesNotExist:
        raise HttpError(404, "해당 원자재가 존재하지 않습니다.")


async def get_materials_by_factory(factory_id: int, user=None):
    """공장의 모든 원자재를 조회합니다."""
    # 공장 소유권 검증
    await verify_factory_ownership(factory_id, user)

    materials = Material.objects.filter(
        factory_id=factory_id, factory__owner=user
    ).order_by("-created_at")
    return materials


async def search_materials_by_factory(factory_id: int, user=None, query: str = ""):
    """공장의 원자재를 검색합니다."""
    # 공장 소유권 검증
    await verify_factory_ownership(factory_id, user)

    from stock.schemas.inbound import MaterialFilter

    # FilterSchema를 사용하여 검색
    filter_schema = MaterialFilter()
    if query:
        # 검색어가 있으면 name, code, spec에 대해 검색
        filter_schema.name = query
        filter_schema.code = query
        filter_schema.spec = query

    queryset = Material.objects.filter(factory_id=factory_id, factory__owner=user)
    queryset = filter_schema.filter(queryset)

    return queryset.order_by("-created_at")


async def get_material_history_by_material(
    material_id: int, factory_id: int, user=None, months=None
):
    """원자재의 히스토리를 조회합니다."""
    # 원자재 소유권 검증
    await get_material_by_id_with_ownership(material_id, factory_id, user)

    queryset = MaterialHistory.objects.filter(
        material_id=material_id, material__factory__owner=user
    ).order_by("-created_at")

    if months:
        # 최근 N개월 데이터만 조회
        start_date = timezone.now() - timedelta(days=months * 30)
        queryset = queryset.filter(created_at__gte=start_date)

    return queryset


async def get_material_history_by_id(history_id: int, user=None):
    """원자재 히스토리 ID로 히스토리를 조회하고 공장 소유권을 검증합니다."""
    try:
        history = await MaterialHistory.objects.aget(
            id=history_id, material__factory__owner=user
        )
        return history
    except MaterialHistory.DoesNotExist:
        raise HttpError(404, "해당 원자재 히스토리가 존재하지 않습니다.")


async def create_material_history(
    material,
    client,
    type,
    quantity,
    price=None,
    warehouse_location=None,
    expiration_date=None,
    user=None,
):
    """원자재 히스토리를 생성하고 재고를 업데이트합니다."""
    # 원자재 소유권 검증 - user를 직접 전달
    await get_material_by_id_with_ownership(material.id, material.factory_id, user)

    if type == MaterialHistory.MaterialHistoryType.purchase:
        material.current_stock += quantity
    else:  # consumption
        material.current_stock -= quantity

    if material.current_stock < 0:
        raise HttpError(400, "재고가 부족합니다.")

    await material.asave()

    history = await MaterialHistory.objects.acreate(
        material=material,
        client=client,
        type=type,
        quantity=quantity,
        price=price,
        warehouse_location=warehouse_location,
        expiration_date=expiration_date,
        total_stock=material.current_stock,
    )

    return history


def get_material_status(
    current_stock: int | None,
    max_stock: int | None,
    rop: int | None,
    standard_stock: int | None,
) -> str | None:
    """
    자재 상태를 판단합니다.
    
    Args:
        current_stock: 현재 재고
        max_stock: 적정 재고(최대 재고)
        rop: 재주문점
        standard_stock: 안전 재고
    
    Returns:
        str | None: '과재고', '충분', '위험', '부족', None (판단 불가)
    """
    # current_stock이 없으면 판단 불가
    if current_stock is None:
        return None

    # 현재 재고가 0이면 부족
    if current_stock == 0:
        return "부족"

    # 1. 과재고: 현재 재고 > 최대 재고
    if max_stock is not None:
        if current_stock > max_stock:
            return "과재고"

    # 2. 충분: 최대 재고 >= 현재 재고 > ROP
    if max_stock is not None and rop is not None:
        if current_stock <= max_stock and current_stock > rop:
            return "충분"

    # 3. 위험: ROP >= 현재 재고 > 안전 재고
    if rop is not None and standard_stock is not None:
        if current_stock <= rop and current_stock > standard_stock:
            return "위험"

    # 4. 부족: 현재 재고 <= 안전 재고
    if standard_stock is not None:
        if current_stock <= standard_stock:
            return "부족"

    # 과재고 기준(max_stock)이 없으면 충분으로 표시
    if max_stock is None:
        return "충분"

    # 판단할 수 없는 경우
    return None


def get_expiry_status(material_id: int, expiry_days: int) -> str | None:
    """
    원자재의 유통기한 상태를 판단합니다.
    
    Args:
        material_id: 원자재 ID
        expiry_days: 유통기한 기준 일수
    
    Returns:
        str | None: '양호', '위험', None (해당 항목이 없을 경우)
    """
    # 오늘 날짜 (timezone 기준)
    today = timezone.localdate()
    
    # MaterialHistory에서 remaining_quantity > 0이고 expiration_date가 있는 것들
    histories = MaterialHistory.objects.filter(
        material_id=material_id,
        remaining_quantity__gt=0,
        expiration_date__isnull=False
    ).values_list('expiration_date', flat=True)

    # MaterialRepackaging에서 quantity > 0이고 expiration_date가 있는 것들
    repackagings = MaterialRepackaging.objects.filter(
        parent_history__material_id=material_id,
        quantity__gt=0,
        expiration_date__isnull=False
    ).values_list('expiration_date', flat=True)

    # 모든 유통기한을 합쳐서 가장 짧은 것 찾기
    all_expiry_dates = list(histories) + list(repackagings)
    
    if not all_expiry_dates:
        return None

    # 가장 짧은 유통기한 찾기
    shortest_expiry = min(all_expiry_dates)
    
    # 오늘 날짜와 유통기한의 차이 계산
    days_until_expiry = (shortest_expiry - today).days
    
    # material.expiry_days와 비교
    if days_until_expiry > expiry_days:
        return "양호"
    else:
        return "위험"
