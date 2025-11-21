from ninja.errors import HttpError
from stock.models import Product, ProductHistory, Material, MaterialHistory
from factory.models import Factory
from factory.utils import get_factory_by_id
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q


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
