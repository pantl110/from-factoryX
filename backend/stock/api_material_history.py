from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from typing import List
from api.permissions import require_factory_access
from api.pagination import PartnerPageNumberPagination
from api.security import api_key_auth, jwt_auth
from api.throttling import PartnerApiKeyThrottle
from stock.models import Material, MaterialHistory
from stock.schemas.inbound import (
    MaterialHistoryCreateIn,
    MaterialHistoryDetailFilter,
)
from stock.schemas.outbound import (
    MaterialHistoryDetailOut,
    MaterialHistoryListOut,
    MaterialHistoryItemOut,
)
from factory.models import Factory, FactoryClient
from factory.utils import is_factory_member
from tax.models import NationalTaxService
from repackaging.utils import generate_repackaging_lot_number


router = Router(tags=["MaterialHistory"], auth=jwt_auth)


# @router.post(
#     "single",
#     summary="[C] 단일 원자재 이력 생성",
#     description="특정 원자재의 구매 또는 소모 이력을 생성합니다. 재고가 자동으로 업데이트됩니다.",
#     response={200: MaterialHistoryDetailOut, 400: dict, 404: dict, 500: dict},
# )
# async def create_single_material_history(
#     request, payload: SingleMaterialHistoryCreateIn
# ):
#     factory_id = request.GET.get("factory_id")
#     if not factory_id:
#         raise HttpError(400, "factory_id를 입력해야 합니다.")

#     user = request.auth
#     await is_factory_member(int(factory_id), user)

#     try:
#         material = await Material.objects.aget(id=payload.material_id)
#     except Material.DoesNotExist:
#         raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")

#     try:
#         client = await FactoryClient.objects.aget(id=payload.client_id)
#     except FactoryClient.DoesNotExist:
#         raise HttpError(404, "거래처 정보를 찾을 수 없습니다.")

#     if payload.type not in ["purchase", "consumption"]:
#         raise HttpError(
#             400, "잘못된 거래 타입입니다. 'purchase' 또는 'consumption'을 입력해주세요."
#         )

#     if payload.type == "purchase" and payload.price is None:
#         raise HttpError(400, "구매 시에는 가격을 입력해주세요.")

#     # 재고 부족 체크 (소모인 경우)
#     if payload.type == "consumption":
#         current_stock = material.current_stock
#         if current_stock < payload.quantity:
#             raise HttpError(400, "재고가 부족합니다.")

#     type_mapping = {
#         "purchase": MaterialHistory.MaterialHistoryType.purchase,
#         "consumption": MaterialHistory.MaterialHistoryType.consumption,
#     }

#     material_history = await MaterialHistory.objects.acreate(
#         type=type_mapping[payload.type],
#         material=material,
#         client=client,
#         quantity=payload.quantity,
#         price=payload.price,
#         warehouse_location=payload.warehouse_location,
#         expiration_date=payload.expiration_date,
#         remaining_quantity=payload.quantity,
#     )

#     # material을 새로고침하여 업데이트된 재고를 가져옴
#     await sync_to_async(material.refresh_from_db)()

#     return 200, MaterialHistoryDetailOut(
#         id=material_history.id,
#         type=material_history.type,
#         material_id=material_history.material_id,
#         client_id=material_history.client_id,
#         quantity=material_history.quantity,
#         price=material_history.price,
#         lot_number=material_history.lot_number,
#         warehouse_location=material_history.warehouse_location,
#         expiration_date=material_history.expiration_date.isoformat()
#         if material_history.expiration_date
#         else None,
#         total_stock=material.current_stock,
#         remaining_quantity=material_history.remaining_quantity,
#     )


@router.post(
    "",
    summary="[C] 원자재 이력 생성 (구매)",
    description="거래처 ID로 거래처를 조회해 사용합니다. 여러 원자재 구매 이력을 생성하며, 원자재가 없으면 새로 생성하고, 있으면 재고를 업데이트합니다.",
    response={200: MaterialHistoryListOut, 400: dict, 404: dict, 500: dict},
)
async def create_material_history(request, payload: MaterialHistoryCreateIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    factory = await Factory.objects.aget(id=int(factory_id))

    # client_id가 있으면 해당 거래처를 조회 후 필요 시 업데이트,
    # 없으면 client_info로 새 거래처를 생성
    if payload.client_id is not None:
        try:
            client = await FactoryClient.objects.aget(
                factory=factory,
                id=payload.client_id,
            )
        except FactoryClient.DoesNotExist:
            raise HttpError(404, "거래처 정보를 찾을 수 없습니다.")

        # client_info가 넘어오면 해당 client_id에 대해 정보 업데이트
        if payload.client_info is not None:
            updated = False
            for field in [
                "business_registration_number",
                "representative_name",
                "business_type",
                "business_category",
                "address",
            ]:
                new_value = getattr(payload.client_info, field)
                if getattr(client, field) != new_value:
                    setattr(client, field, new_value)
                    updated = True
            # 기존 고객사 수정: is_customer는 기존 값 유지, is_supplier는 True로 강제
            if client.is_supplier is not True:
                client.is_supplier = True
                updated = True
            if updated:
                await client.asave()
    else:
        # client_id가 없으면 client_info가 필수
        if payload.client_info is None:
            raise HttpError(400, "client_id가 없을 때는 client_info를 입력해야 합니다.")

        client = await FactoryClient.objects.acreate(
            factory=factory,
            is_customer=False,
            is_supplier=True,
            name=payload.client_info.name,
            business_registration_number=payload.client_info.business_registration_number,
            representative_name=payload.client_info.representative_name,
            business_type=payload.client_info.business_type,
            business_category=payload.client_info.business_category,
            address=payload.client_info.address,
        )

    material_histories = []

    for material_item in payload.materials:
        try:
            material = await Material.objects.aget(
                factory=factory, code=material_item.code
            )

        except Material.DoesNotExist:
            material = await Material.objects.acreate(
                factory=factory,
                name=material_item.name,
                code=material_item.code,
                spec=material_item.spec,
                unit=material_item.unit,
                current_stock=0,
                standard_stock=0,
            )

        material_history = await MaterialHistory.objects.acreate(
            type=MaterialHistory.MaterialHistoryType.purchase,
            material=material,
            client=client,
            quantity=material_item.quantity,
            price=material_item.price,
            warehouse_location=material_item.warehouse_location,
            expiration_date=material_item.expiration_date,
            remaining_quantity=material_item.quantity,
        )

        # material을 새로고침하여 업데이트된 재고를 가져옴
        await sync_to_async(material.refresh_from_db)()

        material_histories.append(
            MaterialHistoryDetailOut(
                id=material_history.id,
                type=material_history.type,
                material_id=material_history.material_id,
                client_id=material_history.client_id,
                quantity=material_history.quantity,
                price=material_history.price,
                lot_number=material_history.lot_number,
                warehouse_location=material_history.warehouse_location,
                expiration_date=material_history.expiration_date.isoformat()
                if material_history.expiration_date
                else None,
                total_stock=material.current_stock,
                remaining_quantity=material_history.remaining_quantity,
            )
        )

    return 200, MaterialHistoryListOut(materials=material_histories)


# Material Tab
@router.get(
    "",
    summary="[C] 원자재 히스토리 조회",
    description="원자재 히스토리를 조회합니다. material_id가 제공되면 특정 원자재의 히스토리를, 제공되지 않으면 전체 원자재 히스토리를 조회합니다. 기간 설정이 없으면 전체 히스토리를, 기간 설정이 있으면 해당 기간의 히스토리를 조회합니다.",
    auth=[jwt_auth, api_key_auth],
    throttle=[PartnerApiKeyThrottle()],
    response=List[MaterialHistoryItemOut],
)
@paginate(PartnerPageNumberPagination)
async def get_material_history(
    request,
    filters: MaterialHistoryDetailFilter = Query(...),
    factory_id: int = Query(...),
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await require_factory_access(int(factory_id), user)

    # material_id 필터가 제공된 경우 해당 원자재 존재 여부 확인
    if filters.material_id:
        try:
            material = await Material.objects.aget(id=filters.material_id, factory_id=int(factory_id))
        except Material.DoesNotExist:
            raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")

    @sync_to_async
    def get_histories():
        # factory_id로 필터링하여 해당 공장의 원자재 히스토리 조회
        queryset = MaterialHistory.objects.filter(
            material__factory_id=factory_id
        ).select_related("client", "material")
        # type 파라미터 필터링 (영어 값으로 저장되어 있음)
        if filters.type:
            queryset = queryset.filter(type=filters.type)

        # material_id 필터링
        if filters.material_id:
            queryset = queryset.filter(material_id=filters.material_id)

        # material_name으로 부분 일치 검색
        if filters.material_name:
            queryset = queryset.filter(material__name__icontains=filters.material_name)

        # client_id 필터링
        if filters.client_id:
            queryset = queryset.filter(client_id=filters.client_id)

        # receipt_id 필터링
        if filters.receipt_id:
            queryset = queryset.filter(cash_receipt_id=filters.receipt_id)

        # 기타 필터들 적용 (start_date, end_date)
        if filters.start_date:
            queryset = queryset.filter(created_at__date__gte=filters.start_date)
        if filters.end_date:
            queryset = queryset.filter(created_at__date__lte=filters.end_date)

        # is_linked 필터 처리 (False만 사용)
        if filters.is_linked is False:
            # NTS(세금계산서)에 연결된 material_history 수집
            nts_linked_ids = set()
            tax_services = NationalTaxService.objects.filter(factory_id=factory_id)
            for tax_service in tax_services:
                if tax_service.line_items:
                    for item in tax_service.line_items:
                        if isinstance(item, dict):
                            material_history_id = item.get("material_history")
                            if material_history_id:
                                nts_linked_ids.add(material_history_id)

            # 둘 다 미연결만: cash_receipt 없고 NTS에도 미연결
            queryset = queryset.filter(cash_receipt__isnull=True) # 현금영수증 미연결만 남김
            if nts_linked_ids:
                queryset = queryset.exclude(id__in=list(nts_linked_ids)) # NTS에 연결된 것 제외

        # @paginate 데코레이터가 자동으로 페이지네이션을 처리하므로
        # 각 히스토리를 딕셔너리로 변환해서 반환합니다
        histories = list(queryset.order_by("-created_at"))

        # material_id 필터가 있을 때만 NationalTaxService 조회
        # 각 히스토리마다 연결된 세금계산서를 찾기 위해 미리 조회
        history_to_tax_service = {}
        if filters.material_id:
            tax_services = NationalTaxService.objects.filter(factory_id=factory_id)
            for tax_service in tax_services:
                if tax_service.line_items:
                    for item in tax_service.line_items:
                        if isinstance(item, dict):
                            material_history_id = item.get("material_history")
                            if material_history_id:
                                history_to_tax_service[material_history_id] = tax_service.id

        result = []
        for history in histories:
            client_name = history.client.name if history.client else None
            # material_id 필터가 있을 때만 각 히스토리마다 연결된 세금계산서 ID 찾기
            if filters.material_id:
                national_tax_service_id = history_to_tax_service.get(history.id)
            else:
                national_tax_service_id = None

            # 구매 타입이고 잔량이 있는 경우 다음 소분 로트 번호 계산
            next_repackaging_lot_number = None
            if (
                history.type == MaterialHistory.MaterialHistoryType.purchase
                and history.remaining_quantity
                and history.remaining_quantity > 0
                and history.lot_number
            ):
                next_repackaging_lot_number = generate_repackaging_lot_number(
                    history.lot_number
                )

            result.append(
                {
                    "id": history.id,
                    "type": history.type,
                    "material_id": history.material.id,
                    "material_name": history.material.name,
                    "material_code": history.material.code,
                    "material_spec": history.material.spec,
                    "material_unit": history.material.unit,
                    "client_id": history.client_id,
                    "client_name": client_name,
                    "quantity": history.quantity,
                    "unit_price": history.price,
                    "amount": (history.quantity or 0) * (history.price or 0),
                    "date": (
                        history.created_at.isoformat() if history.created_at else None
                    ),
                    "total_stock": history.total_stock,
                    "remaining_quantity": history.remaining_quantity,
                    "cash_receipt": history.cash_receipt_id,
                    "national_tax_service_id": national_tax_service_id,
                    "lot_number": history.lot_number,
                    "warehouse_location": history.warehouse_location,
                    "expiration_date": history.expiration_date.isoformat()
                    if history.expiration_date
                    else None,
                    "next_repackaging_lot_number": next_repackaging_lot_number,
                }
            )

        return result

    return await get_histories()

