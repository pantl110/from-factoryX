from ninja import Router
from ninja.errors import HttpError
from django.contrib.auth import get_user_model
from stock.models import Product, Material, MaterialProduct
from stock.schemas.inbound import SingleProductCreateIn, AssignMaterialProductIn
from stock.schemas.outbound import SingleProductCreateOut
from factory.utils import get_factory_by_id
from stock.utils import get_product_by_id
from api.security import jwt_auth
from django.db import IntegrityError

User = get_user_model()
router = Router(tags=["Onboarding"])


@router.post(
    "",
    summary="[C] 단일 품목 생성",
    description="공장에 연결된 단일 품목을 생성합니다.",
    response={201: SingleProductCreateOut},
    auth=jwt_auth,
)
async def create_single_product(request, payload: SingleProductCreateIn):
    """
    입력 필드:
    - factory_id: 공장 ID
    - name: 품목명
    - code: 품목 코드
    - spec: 규격
    - unit: 단위
    
    반환 필드:
    - factory_id: 공장 ID
    - product_id: 생성된 품목 ID
    """
    user = request.auth
    data = payload.dict()
    factory_id = data.pop("factory_id")
    
    factory = await get_factory_by_id(factory_id, user)
    
    try:
        product = await Product.objects.acreate(
            factory=factory,
            **data
        )
        
        response_data = {
            "factory_id": factory_id,
            "product_id": product.id
        }
        
        return 201, response_data

    except IntegrityError:
        raise HttpError(400, "해당 공장에 이미 존재하는 품목 코드입니다.")


@router.post(
    "/assign",
    summary="[C] 원자재 생성 및 품목 연결",
    description="원자재를 생성하고 품목과 연결합니다.",
    response={201: None},
    auth=jwt_auth,
)
async def assign_materialproduct(request, payload: AssignMaterialProductIn):
    """
    입력 필드:
    - factory_id: 공장 ID
    - product_id: 품목 ID
    - materials: 원자재 목록 (name, code, spec, quantity)
    
    반환 필드: 없음
    """
    user = request.auth
    data = payload.dict()
    factory_id = data.pop("factory_id")
    product_id = data.pop("product_id")
    materials_data = data.pop("materials")
    
    factory = await get_factory_by_id(factory_id, user)
    
    product = await get_product_by_id(product_id, user)
    
    if product.factory_id != factory_id:
        raise HttpError(400, "품목이 해당 공장에 속하지 않습니다.")
    
    try:
        for material_data in materials_data:
            material, created = await Material.objects.aget_or_create(
                factory=factory,
                code=material_data["code"],
                defaults={
                    "name": material_data["name"],
                    "spec": material_data["spec"],
                    "unit": "EA",
                    "current_stock": 0,
                    "standard_stock": 0
                }
            )
            
            material_product, created = await MaterialProduct.objects.aget_or_create(
                product=product,
                material=material,
                defaults={"quantity": material_data["quantity"]}
            )
            
            if not created:
                material_product.quantity = material_data["quantity"]
                await material_product.asave()
        
        return 201, None
        
    except IntegrityError:
        raise HttpError(400, "원자재 코드가 중복되거나 연결 정보에 오류가 있습니다.")
