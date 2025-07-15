from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from stock.schemas.inbound import MaterialProductConnectIn, MaterialProductUpdateIn
from stock.schemas.outbound import MaterialProductConnectOut, MaterialProductConnectionOut
from stock.models import Material, Product, MaterialProduct
from factory.models import Factory
from typing import List

router = Router(tags=["MaterialProduct"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] MaterialProduct 연결 생성",
    description="원자재와 제품을 연결하여 BOM(Bill of Materials)을 생성합니다. type에 따라 원자재 기준 또는 제품 기준으로 연결할 수 있습니다.",
    response={200: MaterialProductConnectOut, 400: dict, 404: dict, 500: dict}
)
async def create_material_product_connections(request, payload: MaterialProductConnectIn):
    if payload.type == "material":
        target_model = Material
        target_name = "원자재"
    elif payload.type == "product":
        target_model = Product
        target_name = "제품"
    else:
        raise HttpError(400, "올바르지 않은 타입입니다. 'material' 또는 'product'를 입력해주세요.")
    
    # 기준이 되는 대상 조회
    try:
        target = await sync_to_async(target_model.objects.get)(id=payload.target_id)
    except target_model.DoesNotExist:
        raise HttpError(404, f"해당 {target_name}을 찾을 수 없습니다.")
    
    # 연결할 대상들의 모델 결정
    if payload.type == "material":
        connection_model = Product
        connection_name = "제품"
    else:  # payload.type == "product"
        connection_model = Material
        connection_name = "원자재"
    
    # 연결할 대상들 조회 및 검증
    connection_ids = [conn.id for conn in payload.connections]
    try:
        connections = await sync_to_async(list)(
            connection_model.objects.filter(id__in=connection_ids)
        )
    except Exception:
        raise HttpError(404, f"일부 {connection_name}를 찾을 수 없습니다.")
    
    if len(connections) != len(connection_ids):
        raise HttpError(404, f"일부 {connection_name}를 찾을 수 없습니다.")
    
    # MaterialProduct 연결 생성
    created_connections = []
    
    for connection_item in payload.connections:
        # 이미 존재하는 연결인지 확인
        if payload.type == "material":
            # 원자재 기준: material_id = target_id, product_id = connection_item.id
            existing = await sync_to_async(MaterialProduct.objects.filter(
                material_id=payload.target_id,
                product_id=connection_item.id
            ).exists)()
            
            if existing:
                continue  # 이미 존재하면 스킵
            
            material_product = await sync_to_async(MaterialProduct.objects.create)(
                material=target,
                product=next(c for c in connections if c.id == connection_item.id),
                quantity=connection_item.quantity
            )
        else:  # payload.type == "product"
            # 제품 기준: product_id = target_id, material_id = connection_item.id
            existing = await sync_to_async(MaterialProduct.objects.filter(
                product_id=payload.target_id,
                material_id=connection_item.id
            ).exists)()
            
            if existing:
                continue  # 이미 존재하면 스킵
            
            material_product = await sync_to_async(MaterialProduct.objects.create)(
                product=target,
                material=next(c for c in connections if c.id == connection_item.id),
                quantity=connection_item.quantity
            )
        
        # 응답용 데이터 생성
        connection_out = MaterialProductConnectionOut(
            id=material_product.id,
            product_id=material_product.product.id,
            material_id=material_product.material.id,
            quantity=float(material_product.quantity),
            product_name=material_product.product.name,
            material_name=material_product.material.name
        )
        created_connections.append(connection_out)
    
    return 200, MaterialProductConnectOut(
        message=f"{len(created_connections)}개의 연결이 성공적으로 생성되었습니다.",
        created_connections=created_connections,
        total_count=len(created_connections)
    )


@router.get(
    "/{target_id}",
    summary="[C] MaterialProduct 연결 조회",
    description="type과 target_id를 기반으로 연결된 항목들을 조회합니다. type이 'material'이면 해당 원자재가 사용되는 제품들을, 'product'이면 해당 제품에 필요한 원자재들을 조회합니다.",
    response={200: List[MaterialProductConnectionOut], 400: dict, 404: dict}
)
async def get_material_product_connections(request, target_id: int, type: str):
    # 타입 검증
    if type == "material":
        target_model = Material
        target_name = "원자재"
        filter_field = "material_id"
    elif type == "product":
        target_model = Product
        target_name = "제품"
        filter_field = "product_id"
    else:
        raise HttpError(400, "올바르지 않은 타입입니다. 'material' 또는 'product'를 입력해주세요.")
    
    # 대상 존재 여부 확인
    try:
        target = await sync_to_async(target_model.objects.get)(id=target_id)
    except target_model.DoesNotExist:
        raise HttpError(404, f"해당 {target_name}을 찾을 수 없습니다.")
    
    # 연결된 항목들 조회
    filter_kwargs = {filter_field: target_id}
    material_products = await sync_to_async(list)(
        MaterialProduct.objects.filter(**filter_kwargs).select_related('product', 'material')
    )
    
    connections = []
    for mp in material_products:
        connection = MaterialProductConnectionOut(
            id=mp.id,
            product_id=mp.product.id,
            material_id=mp.material.id,
            quantity=float(mp.quantity),
            product_name=mp.product.name,
            material_name=mp.material.name
        )
        connections.append(connection)
    
    return connections


@router.delete(
    "/connection/{connection_id}",
    summary="[C] MaterialProduct 연결 삭제",
    description="특정 MaterialProduct 연결을 삭제합니다.",
    response={200: dict, 404: dict}
)
async def delete_material_product_connection(request, connection_id: int):
    """MaterialProduct 연결 삭제"""
    try:
        connection = await sync_to_async(MaterialProduct.objects.get)(id=connection_id)
    except MaterialProduct.DoesNotExist:
        raise HttpError(404, "해당 연결을 찾을 수 없습니다.")
    
    await sync_to_async(connection.delete)()
    
    return 200, {
        "message": "연결이 성공적으로 삭제되었습니다.",
        "deleted_connection_id": connection_id
    }


@router.patch(
    "/connection/{connection_id}",
    summary="[U] MaterialProduct 연결 수정",
    description="특정 MaterialProduct 연결의 수량을 수정합니다.",
    response={200: dict, 404: dict}
)
async def update_material_product_connection(request, connection_id: int, payload: MaterialProductUpdateIn):
    try:
        connection = await sync_to_async(MaterialProduct.objects.get)(id=connection_id)
    except MaterialProduct.DoesNotExist:
        raise HttpError(404, "해당 연결을 찾을 수 없습니다.")

    connection.quantity = payload.quantity
    await sync_to_async(connection.save)()
    return 200, {
        "message": "연결이 성공적으로 수정되었습니다.",
        "updated_connection_id": connection_id,
        "quantity": float(connection.quantity)
    }
