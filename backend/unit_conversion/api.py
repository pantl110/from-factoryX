from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.security import jwt_auth
from factory.models import Factory
from unit_conversion.models import UnitConversion
from unit_conversion.schemas.inbound import UnitConversionCreateSchema
from unit_conversion.schemas.outbound import UnitConversionOutSchema
from stock.utils import get_material_by_id, get_product_by_id
from unit_conversion.utils import get_unit_conversion_by_id
from asgiref.sync import sync_to_async


from factory.utils import is_factory_member

router = Router(tags=["Unit Conversion"])


@router.post(
    "",
    summary="[C] 단위변환 정보 생성",
    description="단위변환 정보를 생성합니다.",
    response=UnitConversionOutSchema,
    auth=jwt_auth,
)
async def create_unit_conversion(request, payload: UnitConversionCreateSchema):
    user = request.auth
    data = payload.dict()
    factory_id = data.pop("factory_id")
    await is_factory_member(factory_id, user)

    material = None
    material_id = data.pop("material_id", None)
    if material_id is not None:
        material = await get_material_by_id(material_id, factory_id)

    product = None
    product_id = data.pop("product_id", None)
    if product_id is not None:
        product = await get_product_by_id(product_id, factory_id)

    unit_conversion = await UnitConversion.objects.acreate(
        factory_id=factory_id,
        material=material,
        product=product,
        **data,
    )

    return unit_conversion


@router.get(
    "",
    summary="[R] 단위변환 정보 목록 조회",
    description="공장의 단위변환 정보 목록을 조회합니다.",
    response=list[UnitConversionOutSchema],
    auth=jwt_auth,
)
@paginate
async def list_unit_conversions(request, factory_id: int):
    user = request.auth
    await is_factory_member(factory_id, user)

    @sync_to_async
    def get_unit_conversions():
        queryset = UnitConversion.objects.filter(factory_id=factory_id).select_related('material', 'product')
        return list(queryset)
    
    return await get_unit_conversions()


@router.get(
    "/material/{material_id}",
    summary="[R] 특정 원자재에 대한 단위변환 정보 조회",
    description="단위변환 정보의 상세 내용을 조회합니다.",
    response=list[UnitConversionOutSchema],
    auth=jwt_auth,
)
async def get_unit_conversion_by_material(request, material_id: int, factory_id: int):
    user = request.auth
    await is_factory_member(factory_id, user)

    @sync_to_async
    def fetch_unit_conversion_with_material():
        queryset = UnitConversion.objects.filter(
            factory_id=factory_id,
            material_id=material_id,
        ).select_related('material', 'product')
        return list(queryset)

    return await fetch_unit_conversion_with_material()


@router.get(
    "/product/{product_id}",
    summary="[R] 특정 품목에 대한 단위변환 정보 조회",
    description="단위변환 정보의 상세 내용을 조회합니다.",
    response=list[UnitConversionOutSchema],
    auth=jwt_auth,
)
async def get_unit_conversion_by_product(request, product_id: int, factory_id: int):
    user = request.auth
    await is_factory_member(factory_id, user)

    @sync_to_async
    def fetch_unit_conversion_with_product():
        queryset = UnitConversion.objects.filter(
            factory_id=factory_id,
            product_id=product_id,
        ).select_related('material', 'product')
        return list(queryset)

    return await fetch_unit_conversion_with_product()


@router.patch(
    "/{unit_conversion_id}",
    summary="[U] 단위변환 정보 수정",
    description="단위변환 정보를 수정합니다.",
    response=UnitConversionOutSchema,
    auth=jwt_auth,
)
async def update_unit_conversion(request, unit_conversion_id: int, payload: UnitConversionCreateSchema):
    user = request.auth
    data = payload.dict(exclude_unset=True)
    factory_id = data.pop("factory_id")
    await is_factory_member(factory_id, user)

    unit_conversion = await get_unit_conversion_by_id(unit_conversion_id, factory_id)
    
    material = None
    material_id = data.pop("material_id", None)
    if material_id is not None:
        material = await get_material_by_id(material_id, factory_id)

    product = None
    product_id = data.pop("product_id", None)
    if product_id is not None:
        product = await get_product_by_id(product_id, factory_id)

    # 업데이트
    for key, value in data.items():
        setattr(unit_conversion, key, value)
    
    unit_conversion.material = material
    unit_conversion.product = product
    await unit_conversion.asave()

    return unit_conversion


@router.delete(
    "/{unit_conversion_id}",
    summary="[D] 단위변환 정보 삭제",
    description="단위변환 정보를 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_unit_conversion(request, unit_conversion_id: int, factory_id: int):
    user = request.auth
    await is_factory_member(factory_id, user)

    unit_conversion = await get_unit_conversion_by_id(unit_conversion_id, factory_id)
    await unit_conversion.adelete()
    return 204, None
