from ninja.errors import HttpError
from stock.models import Product, ProductHistory, Material, MaterialHistory
from factory.models import Factory
from django.utils import timezone
from datetime import timedelta


async def get_product_by_id(product_id: int):
    try:
        product = await Product.objects.aget(id=product_id)
        return product
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품이 존재하지 않습니다.")
    

async def get_history_by_id(history_id: int):
    try:
        return await ProductHistory.objects.select_related("product__factory").aget(id=history_id)
    except ProductHistory.DoesNotExist:
        raise HttpError(404, "해당 입출고 이력이 존재하지 않습니다.")


async def get_material_by_id(material_id: int, user=None):
    try:
        material = await Material.objects.aget(id=material_id, factory__owner=user)
        return material
    except Material.DoesNotExist:
        raise HttpError(404, "해당 원자재가 존재하지 않습니다.")


async def get_materials_by_factory(factory_id: int, user=None):
    materials = Material.objects.filter(
        factory_id=factory_id,
        factory__owner=user
    ).order_by("-created_at")
    return materials


async def get_material_history_by_material(material_id: int, user=None, months=None):
    queryset = MaterialHistory.objects.filter(
        material_id=material_id,
        material__factory__owner=user
    ).order_by("-created_at")
    
    if months:
        # 최근 N개월 데이터만 조회
        start_date = timezone.now() - timedelta(days=months * 30)
        queryset = queryset.filter(created_at__gte=start_date)
    
    return queryset


async def get_material_history_by_id(history_id: int, user=None):
    try:
        history = await MaterialHistory.objects.aget(
            id=history_id,
            material__factory__owner=user
        )
        return history
    except MaterialHistory.DoesNotExist:
        raise HttpError(404, "해당 원자재 히스토리가 존재하지 않습니다.")


async def create_material_history(material, client, type, quantity, price=None):
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
        total_stock=material.current_stock
    )
    
    return history 
