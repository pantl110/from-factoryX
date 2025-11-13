from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth

from stock.schemas.inbound import MaterialProductConnectIn, MaterialProductUpdateIn
from stock.schemas.outbound import (
    MaterialProductConnectOut,
    MaterialProductConnectionOut,
)
from stock.models import Material, Product, MaterialProduct
from factory.utils import is_factory_member
from project.utils import check_material_availability
from substitute.models import Substitute

router = Router(tags=["MaterialProduct"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 원자재와 품목 연결 생성",
    description="원자재와 품목을 연결합니다.",
    response={200: MaterialProductConnectOut, 400: dict, 404: dict, 500: dict},
)
async def create_material_product_connections(
    request, payload: MaterialProductConnectIn
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    if payload.type == "material":
        target_model = Material
        target_name = "원자재"
    elif payload.type == "product":
        target_model = Product
        target_name = "제품"
    else:
        raise HttpError(
            400, "올바르지 않은 타입입니다. 'material' 또는 'product'를 입력해주세요."
        )

    try:
        target = await sync_to_async(target_model.objects.get)(id=payload.target_id)
    except target_model.DoesNotExist:
        raise HttpError(404, f"해당 {target_name}을 찾을 수 없습니다.")

    if payload.type == "material":
        connection_model = Product
        connection_name = "제품"
    else:
        connection_model = Material
        connection_name = "원자재"

    connection_ids = [conn.id for conn in payload.connections]
    try:
        connections = await sync_to_async(list)(
            connection_model.objects.filter(id__in=connection_ids)
        )
    except Exception:
        raise HttpError(404, f"일부 {connection_name}를 찾을 수 없습니다.")

    if len(connections) != len(connection_ids):
        raise HttpError(404, f"일부 {connection_name}를 찾을 수 없습니다.")

    created_connections = []

    for connection_item in payload.connections:
        if payload.type == "material":
            existing = await sync_to_async(
                MaterialProduct.objects.filter(
                    material_id=payload.target_id, product_id=connection_item.id
                ).exists
            )()

            if existing:
                continue

            material_product = await sync_to_async(MaterialProduct.objects.create)(
                material=target,
                product=next(c for c in connections if c.id == connection_item.id),
                quantity=connection_item.quantity,
            )
        else:
            existing = await sync_to_async(
                MaterialProduct.objects.filter(
                    product_id=payload.target_id, material_id=connection_item.id
                ).exists
            )()

            if existing:
                continue

            material_product = await sync_to_async(MaterialProduct.objects.create)(
                product=target,
                material=next(c for c in connections if c.id == connection_item.id),
                quantity=connection_item.quantity,
            )

        connection_out = MaterialProductConnectionOut(
            id=material_product.id,
            product_id=material_product.product.id,
            material_id=material_product.material.id,
            quantity=float(material_product.quantity),
            product_name=material_product.product.name,
            material_name=material_product.material.name,
        )
        created_connections.append(connection_out)

    return 200, MaterialProductConnectOut(
        message=f"{len(created_connections)}개의 연결이 성공적으로 생성되었습니다.",
        created_connections=created_connections,
        total_count=len(created_connections),
    )


# Material/Product Tab
@router.get(
    "/{target_id}",
    summary="[C] 원자재와 품목 연결 조회",
    description="원자재와 품목 연결 정보를 조회합니다.",
    response={200: list, 400: dict, 404: dict},
)
async def get_material_product_connections(request, target_id: int, type: str):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    if type == "material":
        target_model = Material
        filter_field = "material_id"
    elif type == "product":
        target_model = Product
        filter_field = "product_id"
    else:
        raise HttpError(
            400, "올바르지 않은 타입입니다. 'material' 또는 'product'를 입력해주세요."
        )

    try:
        target = await sync_to_async(target_model.objects.get)(id=target_id)
    except target_model.DoesNotExist:
        raise HttpError(404, "해당 대상을 찾을 수 없습니다.")

    filter_kwargs = {filter_field: target_id}
    material_products = await sync_to_async(list)(
        MaterialProduct.objects.filter(**filter_kwargs).select_related(
            "product", "material"
        )
    )

    results = []
    if type == "product":
        # 모든 자재 ID 수집
        material_ids = [mp.material.id for mp in material_products]
        
        @sync_to_async
        def get_substitute_names(material_ids):
            """모든 자재의 대체자재 이름을 한 번에 조회합니다."""
            if not material_ids:
                return {}
            
            # 모든 대체자재 관계를 한 번에 조회 (N+1 쿼리 방지)
            substitutes = Substitute.objects.filter(
                factory_id=int(factory_id), source_material_id__in=material_ids
            ).prefetch_related("target_materials")
            
            # material_id -> 대체자재 이름 리스트 매핑 생성
            return {
                sub.source_material_id: [m.name for m in sub.target_materials.all()]
                for sub in substitutes
            }
        
        # 모든 대체자재 이름을 한 번에 조회
        substitute_names_map = await get_substitute_names(material_ids)
        
        for mp in material_products:
            material = mp.material
            results.append(
                {
                    "connection_id": mp.id,
                    "material_id": material.id,
                    "material_name": material.name,
                    "material_code": material.code,
                    "material_spec": material.spec,
                    "material_unit": material.unit,
                    "material_current_stock": int(material.current_stock or 0),
                    "material_standard_stock": int(material.standard_stock or 0),
                    "substitutes": substitute_names_map.get(material.id, []),
                    "quantity": float(mp.quantity),
                }
            )
    else:
        for mp in material_products:
            results.append(
                {
                    "connection_id": mp.id,
                    "product_id": mp.product.id,
                    "product_name": mp.product.name,
                    "product_code": mp.product.code,
                    "product_spec": mp.product.spec,
                    "product_unit": mp.product.unit,
                }
            )

    return results


@router.patch(
    "/connection/{connection_id}",
    summary="[C] 원자재와 품목 연결 수정",
    description="특정 품목에 연결된 원자재의 수량을 수정합니다.",
    response={200: dict, 404: dict},
)
async def update_material_product_connection(
    request, connection_id: int, payload: MaterialProductUpdateIn
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        connection = await sync_to_async(MaterialProduct.objects.get)(id=connection_id)
    except MaterialProduct.DoesNotExist:
        raise HttpError(404, "해당 연결을 찾을 수 없습니다.")

    connection.quantity = payload.quantity
    await sync_to_async(connection.save)()
    return 200, {
        "message": "연결이 성공적으로 수정되었습니다.",
        "updated_connection_id": connection_id,
        "quantity": float(connection.quantity),
    }


@router.delete(
    "/connection/{connection_id}",
    summary="[C] 원자재와 품목 연결 삭제",
    description="특정 원자재와 품목 연결을 삭제합니다.",
    response={200: dict, 404: dict},
)
async def delete_material_product_connection(request, connection_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        connection = await sync_to_async(MaterialProduct.objects.get)(id=connection_id)
    except MaterialProduct.DoesNotExist:
        raise HttpError(404, "해당 연결을 찾을 수 없습니다.")

    await sync_to_async(connection.delete)()

    return 200, {
        "message": "연결이 성공적으로 삭제되었습니다.",
        "deleted_connection_id": connection_id,
    }
