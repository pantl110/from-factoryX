from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from typing import List
from api.security import jwt_auth

from stock.models import Material, MaterialHistory
from stock.schemas.inbound import (
    MaterialHistoryCreateIn,
    SingleMaterialHistoryCreateIn,
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


router = Router(tags=["MaterialHistory"], auth=jwt_auth)


@router.post(
    "single",
    summary="[C] 단일 원자재 이력 생성",
    description="특정 원자재의 구매 또는 소모 이력을 생성합니다. 재고가 자동으로 업데이트됩니다.",
    response={200: MaterialHistoryDetailOut, 400: dict, 404: dict, 500: dict},
)
async def create_single_material_history(
    request, payload: SingleMaterialHistoryCreateIn
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        material = await Material.objects.aget(id=payload.material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")

    try:
        client = await FactoryClient.objects.aget(id=payload.client_id)
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "거래처 정보를 찾을 수 없습니다.")

    if payload.type not in ["purchase", "consumption"]:
        raise HttpError(
            400, "잘못된 거래 타입입니다. 'purchase' 또는 'consumption'을 입력해주세요."
        )

    if payload.type == "purchase" and payload.price is None:
        raise HttpError(400, "구매 시에는 가격을 입력해주세요.")

    # 재고 부족 체크 (소모인 경우)
    if payload.type == "consumption":
        current_stock = material.current_stock
        if current_stock < payload.quantity:
            raise HttpError(400, "재고가 부족합니다.")

    type_mapping = {
        "purchase": MaterialHistory.MaterialHistoryType.purchase,
        "consumption": MaterialHistory.MaterialHistoryType.consumption,
    }

    material_history = await MaterialHistory.objects.acreate(
        type=type_mapping[payload.type],
        material=material,
        client=client,
        quantity=payload.quantity,
        price=payload.price,
    )

    # material을 새로고침하여 업데이트된 재고를 가져옴
    await sync_to_async(material.refresh_from_db)()

    return 200, MaterialHistoryDetailOut(
        id=material_history.id,
        type=material_history.type,
        material_id=material_history.material_id,
        client_id=material_history.client_id,
        quantity=material_history.quantity,
        price=material_history.price,
        total_stock=material.current_stock,
    )


@router.post(
    "",
    summary="[C] 원자재 이력 생성 (구매)",
    description="거래처 명으로 기존 거래처가 있으면 정보를 업데이트 후 사용하고, 없으면 새로 생성합니다. 여러 원자재 구매 이력을 생성하며, 원자재가 없으면 새로 생성하고, 있으면 재고를 업데이트합니다.",
    response={200: MaterialHistoryListOut, 400: dict, 404: dict, 500: dict},
)
async def create_material_history(request, payload: MaterialHistoryCreateIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    factory = await Factory.objects.aget(id=int(factory_id))

    try:
        client = await FactoryClient.objects.aget(
            factory=factory, name=payload.client_info.name
        )
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
        if updated:
            await client.asave()
    except FactoryClient.DoesNotExist:
        client = await FactoryClient.objects.acreate(
            factory=factory,
            type=FactoryClient.ClientType.supplier,
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
                total_stock=material.current_stock,
            )
        )

    return 200, MaterialHistoryListOut(materials=material_histories)


# Material Tab
@router.get(
    "",
    summary="[C] 원자재 히스토리 조회",
    description="원자재 히스토리를 조회합니다. material_id가 제공되면 특정 원자재의 히스토리를, 제공되지 않으면 전체 원자재 히스토리를 조회합니다. 기간 설정이 없으면 전체 히스토리를, 기간 설정이 있으면 해당 기간의 히스토리를 조회합니다.",
    response=List[MaterialHistoryItemOut],
)
@paginate
async def get_material_history(
    request,
    filters: MaterialHistoryDetailFilter = Query(...),
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    # material_id 필터가 제공된 경우 해당 원자재 존재 여부 확인
    if filters.material_id:
        try:
            material = await Material.objects.aget(id=filters.material_id)
        except Material.DoesNotExist:
            raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")

    @sync_to_async
    def get_histories():
        # factory_id로 필터링하여 해당 공장의 원자재 히스토리 조회
        queryset = MaterialHistory.objects.filter(
            material__factory_id=factory_id
        ).select_related("client", "material")
        # type 파라미터 영어→한글 변환 지원
        if filters.type:
            type_map = {"purchase": "구매", "consumption": "소모"}
            if filters.type in type_map:
                queryset = queryset.filter(type=type_map[filters.type])
            else:
                queryset = queryset.filter(type=filters.type)

        # material_name으로 부분 일치 검색
        if filters.material_name:
            queryset = queryset.filter(material__name__icontains=filters.material_name)

        # client_id 필터링
        if filters.client_id:
            queryset = queryset.filter(client_id=filters.client_id)

        # material_id를 제외한 다른 필터들 적용 (start_date, end_date)
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
        national_tax_service_id = None
        if filters.material_id:
            # SQLite에서 JSON contains lookup이 지원되지 않으므로 다른 방법 사용
            tax_services = NationalTaxService.objects.filter(factory_id=factory_id)
            for tax_service in tax_services:
                if tax_service.line_items:
                    for item in tax_service.line_items:
                        if (
                            isinstance(item, dict)
                            and item.get("material_history") == filters.material_id
                        ):
                            national_tax_service_id = tax_service.id
                            break
                if national_tax_service_id:
                    break

        result = []
        for history in histories:
            client_name = history.client.name if history.client else None

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
                    "cash_receipt": history.cash_receipt_id,
                    "national_tax_service_id": national_tax_service_id,
                }
            )

        return result

    return await get_histories()
