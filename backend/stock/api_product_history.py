from ninja import Router, Query
from ninja.pagination import paginate
from ninja.errors import HttpError
from api.permissions import require_factory_access
from api.pagination import PartnerPageNumberPagination
from api.security import api_key_auth, jwt_auth
from api.throttling import PartnerApiKeyThrottle
from asgiref.sync import sync_to_async
from typing import List
from stock.models import Product, ProductHistory
from stock.schemas.inbound import ProductHistoryCreateIn, ProductHistoryFilter
from stock.schemas.outbound import ProductHistoryOut
from factory.utils import is_factory_member


router = Router(tags=["ProductHistory"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 제품 입출고 이력 등록",
    description="제품 입출고 이력을 등록합니다.",
    response={201: ProductHistoryOut},
    auth=jwt_auth,
)
async def create_product_history(request, payload: ProductHistoryCreateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    data = payload.dict()
    product_id = data.pop("product")
    
    # # type 필드 검증 (한국어와 영어 모두 허용)
    # type_value = data.get("type")
    # valid_types = [choice[0] for choice in ProductHistory.ProductHistoryType.choices] + [choice[1] for choice in ProductHistory.ProductHistoryType.choices]
    # if type_value not in valid_types:
    #     raise HttpError(400, f"유효하지 않은 type입니다. 가능한 값: {valid_types}")
    
    # # 영어 값을 한국어로 변환 (DB에는 한국어로 저장)
    # if type_value == "in":
    #     data["type"] = "입고"
    # elif type_value == "out":
    #     data["type"] = "출고"
    
    try:
        product = await Product.objects.aget(id=product_id, factory_id=int(factory_id))
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품을 찾을 수 없습니다.")
    
    product_history = await ProductHistory.objects.acreate(product=product, **data)
    
    # ProductHistoryOut 스키마에 맞게 응답 데이터 변환
    response_data = {
        "id": product_history.id,
        "product_id": product_history.product_id,
        "total_stock": product_history.total_stock,
        "project_id": product_history.project_id,
        "client_name": product_history.client_name,
        "production_quantity": product_history.production_quantity,
        "delivery_quantity": product_history.delivery_quantity,
        "quantity": product_history.quantity,
        "is_canceled": product_history.is_canceled,
        "created_at": product_history.created_at,
        "updated_at": product_history.updated_at,
    }
    return 201, response_data


@router.get(
    "",
    summary="[C] 제품 입출고 이력 목록 조회",
    description="사용자가 소유한 공장의 제품 입출고 이력을 조회합니다.",
    response={200: List[ProductHistoryOut]},
    auth=[jwt_auth, api_key_auth],
    throttle=[PartnerApiKeyThrottle()],
)
@paginate(PartnerPageNumberPagination)
async def list_product_histories(request, filters: ProductHistoryFilter = Query(...), factory_id: int = Query(...)):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await require_factory_access(int(factory_id), user)


    @sync_to_async
    def get_histories():
        queryset = (
            ProductHistory.objects.filter(product__factory_id=int(factory_id))
            .select_related("product")
            .order_by("-created_at")
        )
        
        # 기본적으로 is_canceled=False인 것만 조회 (필터에서 명시적으로 지정하지 않은 경우)
        if filters.is_canceled is None:
            queryset = queryset.filter(is_canceled=False)
        
        queryset = filters.filter(queryset)
        return list(queryset)

    @sync_to_async
    def check_more_history(product_id, project_id):
        if project_id is None:
            return False
        # is_canceled=true인 히스토리들 중에서 같은 제품과 같은 프로젝트에 대한 추가 히스토리가 있는지 확인
        return ProductHistory.objects.filter(
            product__factory_id=int(factory_id),
            product_id=product_id,
            project_id=project_id,
            is_canceled=True
        ).exists()

    histories = await get_histories()
    
    # ProductHistoryOut 스키마에 맞게 응답 데이터 변환
    response_data = []
    for history in histories:
        has_more = await check_more_history(history.product_id, history.project_id)
        response_data.append({
            "id": history.id,
            "product_id": history.product_id,
            "project_id": history.project_id,
            "client_name": history.client_name,
            "production_quantity": history.production_quantity,
            "delivery_quantity": history.delivery_quantity,
            "quantity": history.quantity,
            "total_stock": history.total_stock,
            "is_canceled": history.is_canceled,
            "has_more_history": has_more,
            "created_at": history.created_at,
            "updated_at": history.updated_at,
        })
    return response_data


# Product Tab
@router.get(
    "/{history_id}",
    summary="[C] 제품 입출고 이력 상세 조회",
    description="입출고 이력 ID로 상세 정보를 조회합니다.",
    response={200: ProductHistoryOut},
    auth=[jwt_auth, api_key_auth],
    throttle=[PartnerApiKeyThrottle()],
)
async def get_product_history(request, history_id: int, factory_id: int = Query(...)):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await require_factory_access(int(factory_id), user)

    try:
        history = await ProductHistory.objects.select_related("product").aget(
            id=history_id,
            product__factory_id=int(factory_id)
        )
    except ProductHistory.DoesNotExist:
        raise HttpError(404, "해당 입출고 이력을 찾을 수 없습니다.")
    
    # ProductHistoryOut 스키마에 맞게 응답 데이터 변환
    response_data = {
        "id": history.id,
        "product_id": history.product_id,
        "project_id": history.project_id,
        "client_name": history.client_name,
        "production_quantity": history.production_quantity,
        "delivery_quantity": history.delivery_quantity,
        "quantity": history.quantity,
        "total_stock": history.total_stock,
        "is_canceled": history.is_canceled,
        "created_at": history.created_at,
        "updated_at": history.updated_at,
    }
    return response_data
