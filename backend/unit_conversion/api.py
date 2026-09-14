from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.permissions import require_factory_access
from api.security import api_key_auth, jwt_auth
from api.throttling import PartnerApiKeyThrottle
from factory.models import Factory
from unit_conversion.models import UnitConversion
from unit_conversion.schemas.inbound import UnitConversionCreateSchema, UnitConversionFilter
from unit_conversion.schemas.outbound import UnitConversionOutSchema
from stock.utils import get_material_by_id, get_product_by_id
from unit_conversion.utils import get_unit_conversion_by_id
from asgiref.sync import sync_to_async
from factory.utils import is_factory_member
from django.db.models import Q, Max, OuterRef, Subquery, IntegerField
from django.db.models.functions import Coalesce

router = Router(tags=["Unit Conversion"])


@router.post(
    "",
    summary="[C/U] 단위변환 정보 생성/수정",
    description="단위변환 정보를 생성하거나(id 포함 시 수정) 합니다.",
    response=UnitConversionOutSchema,
    auth=jwt_auth,
)
async def create_unit_conversion(request, payload: UnitConversionCreateSchema):
    """
    payload.id 가 없으면 새 단위변환을 생성하고,
    payload.id 가 있으면 해당 단위변환을 수정합니다.
    """
    user = request.auth

    # 공통 데이터 분리
    data_for_update = payload.dict(exclude_unset=True)
    factory_id = data_for_update.pop("factory_id")
    unit_conversion_id = data_for_update.pop("id", None)
    await is_factory_member(factory_id, user)

    # id 가 있는 경우: 수정(update) 동작 (PATCH 와 동일한 로직)
    if unit_conversion_id is not None:
        unit_conversion = await get_unit_conversion_by_id(unit_conversion_id, factory_id)

        material = None
        material_id = data_for_update.pop("material_id", None)
        if material_id is not None:
            material = await get_material_by_id(material_id, factory_id)

        product = None
        product_id = data_for_update.pop("product_id", None)
        if product_id is not None:
            product = await get_product_by_id(product_id, factory_id)

        for key, value in data_for_update.items():
            setattr(unit_conversion, key, value)

        unit_conversion.material = material
        unit_conversion.product = product
        await unit_conversion.asave()

        return unit_conversion

    # id 가 없는 경우: 생성(create) 동작
    create_data = payload.dict()
    factory_id = create_data.pop("factory_id")

    material = None
    material_id = create_data.pop("material_id", None)
    if material_id is not None:
        material = await get_material_by_id(material_id, factory_id)

    product = None
    product_id = create_data.pop("product_id", None)
    if product_id is not None:
        product = await get_product_by_id(product_id, factory_id)

    unit_conversion = await UnitConversion.objects.acreate(
        factory_id=factory_id,
        material=material,
        product=product,
        **create_data,
    )

    return unit_conversion


@router.get(
    "",
    summary="[R] 단위변환 정보 목록 조회",
    description="공장의 단위변환 정보 목록을 조회합니다.",
    response=list[UnitConversionOutSchema],
    auth=[jwt_auth, api_key_auth],
    throttle=[PartnerApiKeyThrottle()],
)
@paginate
async def list_unit_conversions(
    request,
    factory_id: int,
    filters: UnitConversionFilter = Query(None),
    q: str = None,
    item_type: str = None,
):
    user = request.auth
    await require_factory_access(factory_id, user)

    @sync_to_async
    def get_unit_conversions():
        queryset = UnitConversion.objects.filter(factory_id=factory_id).select_related('material', 'product')

        # item_type 필터링 (material 또는 product)
        if item_type == 'material':
            queryset = queryset.filter(material__isnull=False, product__isnull=True)
        elif item_type == 'product':
            queryset = queryset.filter(product__isnull=False, material__isnull=True)
        
        # 검색어 q가 제공된 경우, material_name과 product_name으로 검색
        if q:
            queryset = queryset.filter(
                Q(material__name__icontains=q) | 
                Q(product__name__icontains=q)
            )
        
        # 필터 적용
        if filters:
            queryset = filters.filter(queryset)
        
        # 정렬: 같은 material_id 또는 product_id끼리 그룹화하여 최신 그룹이 먼저 오도록
        # material_id가 있으면 material_id로, 없으면 product_id로 그룹화
        # Subquery를 사용하여 각 그룹의 최대 id 계산
        
        # material 그룹의 최대 id (material_id가 있는 경우)
        material_group_max = Subquery(
            UnitConversion.objects.filter(
                factory_id=factory_id,
                material_id=OuterRef('material_id')
            ).values('material_id').annotate(max_id=Max('id')).values('max_id')[:1],
            output_field=IntegerField()
        )
        
        # product 그룹의 최대 id (product_id가 있는 경우)
        product_group_max = Subquery(
            UnitConversion.objects.filter(
                factory_id=factory_id,
                product_id=OuterRef('product_id')
            ).values('product_id').annotate(max_id=Max('id')).values('max_id')[:1],
            output_field=IntegerField()
        )
        
        # material_id가 있으면 material 그룹의 최대 id, 없으면 product 그룹의 최대 id 사용
        queryset = queryset.annotate(
            group_max_id=Coalesce(material_group_max, product_group_max, 'id', output_field=IntegerField())
        ).order_by('-group_max_id', '-id')
        
        # ModelSchema 의 resolver 에서 material_* / product_* 를 계산하므로
        # 여기서는 queryset 만 리스트로 반환
        return list(queryset)
    
    return await get_unit_conversions()


@router.get(
    "/material/{material_id}",
    summary="[R] 특정 원자재에 대한 단위변환 정보 조회",
    description="단위변환 정보의 상세 내용을 조회합니다.",
    response=list[UnitConversionOutSchema],
    auth=[jwt_auth, api_key_auth],
    throttle=[PartnerApiKeyThrottle()],
)
async def get_unit_conversion_by_material(request, material_id: int, factory_id: int):
    user = request.auth
    await require_factory_access(factory_id, user)

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
    auth=[jwt_auth, api_key_auth],
    throttle=[PartnerApiKeyThrottle()],
)
async def get_unit_conversion_by_product(request, product_id: int, factory_id: int):
    user = request.auth
    await require_factory_access(factory_id, user)

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
