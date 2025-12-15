from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from tax.models import NationalTaxService
from factory.utils import get_factory_by_id, is_factory_member, get_factory_client_by_id
from django.db import transaction
from tax.utils import get_tax_service_by_id
from tax.barobill_utils import (
    issue_barobill_tax_invoice,
    get_state_barobill_tax_invoice,
    cancel_barobill_tax_invoice,
)
from tax.schemas.inbound import (
    NationalTaxServiceCreateIn,
    NationalTaxServiceUpdateIn,
    TaxInvoiceFilter,
    TaxToMaterialHistoryIn,
)
from tax.schemas.outbound import (
    NationalTaxServiceOut,
    TaxInvoiceByMaterialOut,
)
from tax.schemas.inbound import LinkTaxInvoiceIn
from api.security import jwt_auth
from typing import List
from ninja import Query
from tax.models import NationalTaxService
from datetime import date, timedelta
from project.models import Project
from django.conf import settings
from barobill.barobill_error_code import (
    barobill_error_codes,
)
from barobill.barobill_state import (
    barobill_tax_service_states,
    nts_tax_service_states,
    barobill_purpose_types,
)
from datetime import datetime
from typing import List
from factory.schemas.outbound import FactoryRowOut, FactoryClientRowOut
from stock.schemas.outbound import ProductRowOut
from websocket.utils import send_notification_to_factory
from stock.models import MaterialHistory


router = Router(tags=["Tax"], auth=jwt_auth)

# 세금계산서 API 구조
# POST /api/tax/ - tax_id가 없으면 생성, 있으면 수정 (통합 API)
# PATCH /api/tax/{tax_id} - 일반적인 수정 (임시저장 상태에서만 모든 필드 수정 가능)
# PATCH /api/tax/{tax_id} - 발행된 세금계산서는 is_hidden만 수정 가능


@router.get(
    "/published",
    summary="[C] 발행된 모든 세금계산서 조회",
    description="조건에 따라 세금계산서를 조회합니다.",
    response=List[NationalTaxServiceOut],
)
@paginate
async def list_published_tax_invoices(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    filters: TaxInvoiceFilter = Query(..., description="검색 필터"),
    ordering: str = Query(
        default="-transaction_date",
        description="작성일자 정렬: -transaction_date(최신순), transaction_date(오래된순)",
    ),
):
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)
    # TODO: 권한 체크

    @sync_to_async
    def get_all_tax_invoices():
        queryset = NationalTaxService.objects.filter(
            factory_id=factory_id, publish_status="published"
        ).prefetch_related("client")
        queryset = filters.filter(queryset)
        if ordering:
            queryset = queryset.order_by(ordering)

        return list(queryset)

    invoices = await get_all_tax_invoices()

    return invoices


# Tax Tab
@router.get(
    "/pending",
    summary="[C] 발행대기/임시저장 세금계산서 조회",
    description="발행대기 또는 임시저장 상태의 세금계산서를 조회합니다.",
    response=List[NationalTaxServiceOut],
)
@paginate
async def list_pending_tax_invoices(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    filters: TaxInvoiceFilter = Query(..., description="검색 필터"),
    ordering: str = Query(
        default="-transaction_date",
        description="작성일자 정렬: -transaction_date(최신순), transaction_date(오래된순)",
    ),
):
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)

    @sync_to_async
    def get_pending_tax_invoices():
        from django.db.models import Q
        
        queryset = (
            NationalTaxService.objects.filter(
                Q(client__factory_id=factory_id) | Q(client__isnull=True),
                factory_id=factory_id
            )
            .exclude(publish_status="published")
            .prefetch_related("client")
        )
        queryset = filters.filter(queryset)
        if ordering:
            queryset = queryset.order_by(ordering)

        return list(queryset)

    invoices = await get_pending_tax_invoices()
    return invoices


# Tax Tab
@router.get(
    "/unlinked",
    summary="[C] 연동되지 않은 세금계산서 조회",
    description="연동되지 않은 세금계산서를 모두 조회합니다.",
    response=List[NationalTaxServiceOut],
)
@paginate
async def list_not_link_tax(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    filters: TaxInvoiceFilter = Query(..., description="검색 필터"),
    ordering: str = Query(
        default="-transaction_date",
        description="작성일자 정렬: -transaction_date(최신순), transaction_date(오래된순)",
    ),
):
    @sync_to_async
    def get_unlinked_tax_invoices():
        queryset = NationalTaxService.objects.filter(
            projects__isnull=True, client__factory_id=factory_id
        ).prefetch_related("client")
        queryset = filters.filter(queryset)
        if ordering:
            queryset = queryset.order_by(ordering)
        return list(queryset)

    invoices = await get_unlinked_tax_invoices()
    return invoices


# Project Tab
@router.post(
    "/link",
    summary="[C] 선택된 세금계산서 연결",
    description="선택된 세금계산서를 프로젝트에 연결합니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict},
)
async def link_tax(request, payload: LinkTaxInvoiceIn):
    """
    선택된 세금계산서를 프로젝트에 연결합니다.

    입력 필드:
    - project_id: 프로젝트 ID (int)
    - tax_id: 세금계산서 ID (int)

    반환 필드: 없음 (성공 시 빈 응답)
    """
    try:

        @sync_to_async
        def link_tax_invoice():

            # 프로젝트 존재 확인
            try:
                project = Project.objects.get(id=payload.project_id)
            except Project.DoesNotExist:
                raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

            # 세금계산서 존재 확인
            try:
                tax_invoice = NationalTaxService.objects.get(id=payload.tax_id)
            except NationalTaxService.DoesNotExist:
                raise HttpError(
                    404, f"세금계산서 ID {payload.tax_id}를 찾을 수 없습니다."
                )

            # 이미 다른 프로젝트에 연결되어 있는지 확인
            if tax_invoice.projects.exists():
                raise HttpError(
                    400,
                    f"세금계산서 ID {payload.tax_id}는 이미 다른 프로젝트에 연결되어 있습니다.",
                )

            # 프로젝트의 기존 세금계산서가 있다면 제거
            if project.tax_invoice:
                project.tax_invoice = None
                project.save()

            # 새로운 세금계산서 연결
            project.tax_invoice = tax_invoice
            project.save()

            return {}

        result = await link_tax_invoice()
        return result

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "세금계산서 연결 중 내부 서버 오류가 발생했습니다.")


# Material Tab
@router.get(
    "/invoice-by-material-history",
    summary="[C] 자재 이력별 세금계산서 및 구매정보 조회",
    description="material_history_id로 세금계산서(구매) 및 자재정보를 조회",
    response={200: TaxInvoiceByMaterialOut, 404: dict, 500: dict},
)
async def get_tax_invoice_by_material_history(request, material_history_id: int):
    """
    입력 필드(쿼리 파라미터):
    - material_history_id: 원자재 이력 ID (필수)

    반환 필드(dict):
    - client_name: 업체명 (str)
    - business_registration_number: 사업자등록번호 (str)
    - representative_name: 대표자명 (str/null)
    - business_type: 업태 (str/null)
    - business_category: 종목 (str/null)
    - address: 사업장 주소 (str/null)
    - transaction_date: 작성일자 (date)
    - tax_invoice_type: 문서상태(매입/매출) (str)
    - transaction_type: 구분 (str)
    - materials: 구매 자재 정보 리스트(List[dict], 1건)
      - material_name: 자재명 (str)
      - spec: 규격 (str)
      - quantity: 수량 (int)
      - unit: 단위 (str)
      - price: 단가 (int)
      - transaction_amount: 공급가액 (int)
      - tax_amount: 세액 (int)
    """
    from stock.models import MaterialHistory

    try:

        def get_invoice_data(material_history_id):
            try:
                # MaterialHistory 조회
                h = MaterialHistory.objects.select_related(
                    "material", "client"
                ).get(id=material_history_id)
            except MaterialHistory.DoesNotExist:
                return None

            # NationalTaxService에서 line_items에 해당 material_history_id가 있는 세금계산서 찾기
            # 매입 세금계산서만 검색 (tax_invoice_type="purchase")
            # MaterialHistory의 factory와 일치하는 세금계산서만 검색
            tax_services = NationalTaxService.objects.filter(
                tax_invoice_type="purchase",
                factory=h.material.factory,
            ).select_related("client")

            invoice = None
            matched_line_item = None

            for tax_service in tax_services:
                line_items = tax_service.line_items or []
                for item in line_items:
                    # material_history 필드가 material_history_id와 일치하는지 확인
                    item_material_history_id = item.get("material_history")
                    if item_material_history_id is not None:
                        # 타입 변환 (int 또는 str일 수 있음)
                        if int(item_material_history_id) == material_history_id:
                            invoice = tax_service
                            matched_line_item = item
                            break
                if invoice:
                    break

            if not invoice:
                return None

            client = invoice.client
            if not client:
                return None

            return dict(
                client_name=client.name,
                business_registration_number=client.business_registration_number,
                representative_name=client.representative_name,
                business_type=client.business_type,
                business_category=client.business_category,
                address=client.address,
                transaction_date=invoice.transaction_date,
                tax_invoice_type=(
                    "매입" if invoice.tax_invoice_type == "purchase" else "매출"
                ),
                transaction_type=(
                    "영수" if invoice.transaction_type == "receipt" else "청구"
                ),
                materials=[
                    dict(
                        material_name=h.material.name,
                        spec=h.material.spec,
                        quantity=int(h.quantity),  # Decimal을 int로 변환
                        unit=h.material.unit,
                        price=h.price or 0,
                        transaction_amount=invoice.transaction_amount,
                        tax_amount=invoice.tax_amount,
                    )
                ],
            )

        raw_data = await sync_to_async(get_invoice_data)(material_history_id)
        if not raw_data:
            raise HttpError(404, "해당 이력에 연결된 세금계산서가 없습니다.")
        return TaxInvoiceByMaterialOut(**raw_data)
    except Exception as e:
        raise HttpError(500, f"자재 이력별 세금계산서 조회 중 오류: {e}")


@router.post(
    "/{factory_id}/sync",
    summary="[C] 세금계산서 동기화",
    description="국세청 API에서 세금계산서를 동기화합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def sync_tax_invoices(request, factory_id: int):
    user = request.auth
    factory = await get_factory_by_id(factory_id)

    today = date.today()
    past_date = today - timedelta(days=200)

    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory.business_registration_number
    userId = user.barobill_user_id
    taxType = 1
    dateType = 1
    startDate = past_date.strftime("%Y%m%d")  # 200일 전 날짜
    endDate = today.strftime("%Y%m%d")  # 현재 날짜로 설정
    countPerPage = 100  # 최대 100건
    currentPage = 1

    # 매출 세금계산서 조회
    sale_result = settings.BAROBILL_CLIENT.service.GetPeriodTaxInvoiceSalesList(
        CERTKEY=certKey,
        CorpNum=corpNum,
        UserID=userId,
        TaxType=taxType,
        DateType=dateType,
        StartDate=startDate,
        EndDate=endDate,
        CountPerPage=countPerPage,
        CurrentPage=currentPage,
    )

    if sale_result.CurrentPage < 0:
        error_msg = barobill_error_codes.get(sale_result.CurrentPage, "Unknown Error")
        raise HttpError(400, f"바로빌 API 오류 - 매출 세금계산서 조회: {error_msg}")

    # 매입 세금계산서 조회
    purchase_result = settings.BAROBILL_CLIENT.service.GetPeriodTaxInvoicePurchaseList(
        CERTKEY=certKey,
        CorpNum=corpNum,
        UserID=userId,
        TaxType=taxType,
        DateType=dateType,
        StartDate=startDate,
        EndDate=endDate,
        CountPerPage=countPerPage,
        CurrentPage=currentPage,
    )

    if purchase_result.CurrentPage < 0:
        error_code = barobill_error_codes.get(purchase_result, "Unknown Error")
        raise HttpError(400, f"바로빌 API 오류 - 매입 세금계산서 조회: {error_code}")

    # 매출, 매입 세금계산서 DB에서 조회
    existing_sales = await sync_to_async(list)(
        NationalTaxService.objects.filter(
            factory=factory,
            tax_invoice_type="sales",
        ).values_list("nts_send_key", flat=True)
    )

    existing_purchases = await sync_to_async(list)(
        NationalTaxService.objects.filter(
            factory=factory,
            tax_invoice_type="purchase",
        ).values_list("nts_send_key", flat=True)
    )

    sale_tax_service_objects = []

    if sale_result.SimpleTaxInvoiceExList is not None:
        # 매출 세금계산서가 존재하는 경우 sync 처리
        for sale in sale_result.SimpleTaxInvoiceExList.SimpleTaxInvoiceEx:
            if sale.NTSSendKey in existing_sales:
                continue

            # GetTaxInvoiceNK(국세청 승인번호로 세금계산서 조회) API 호출
            certKey = settings.BAROBILL_CERT_KEY
            corpNum = factory.business_registration_number
            ntsConfirmNum = sale.NTSSendKey

            invoice_detail = settings.BAROBILL_CLIENT.service.GetTaxInvoiceNK(
                CERTKEY=certKey,
                CorpNum=corpNum,
                NTSConfirmNum=ntsConfirmNum,
            )

            if invoice_detail.TaxInvoiceType < 0:  # 호출 실패
                raise HttpError(
                    400,
                    f"바로빌 API 오류 - 세금계산서 상세 조회: {barobill_error_codes.get(invoice_detail.TaxInvoiceType, 'Unknown Error')}",
                )

            line_items = []
            for idx, item in enumerate(
                invoice_detail.TaxInvoiceTradeLineItems.TaxInvoiceTradeLineItem, start=1
            ):
                line_items.append(
                    {
                        "id": idx,
                        "purchase_expiry": item.PurchaseExpiry,
                        "product_id": None,
                        "name": item.Name,
                        "code": None,
                        "information": item.Information,
                        "chargeable_unit": item.ChargeableUnit,
                        "unit_price": item.UnitPrice,
                        "amount": item.Amount,
                        "tax": item.Tax,
                        "description": item.Description,
                        "material_history": None,
                    }
                )

            # 매출 세금계산서가 DB에 없으면 새로운 세금계산서 생성
            sale_tax_service_objects.append(
                NationalTaxService(
                    user=user,
                    factory=factory,
                    publish_status="published",
                    tax_invoice_type="sales",
                    transaction_type=barobill_purpose_types.get(
                        invoice_detail.PurposeType
                    ),
                    transaction_date=datetime.strptime(
                        invoice_detail.WriteDate, "%Y%m%d"
                    ).date(),
                    client=None,  # 거래처는 추후에 설정
                    transaction_amount=invoice_detail.AmountTotal,
                    tax_amount=invoice_detail.TaxTotal,
                    nts_send_key=sale.NTSSendKey,
                    barobill_state="발급완료",
                    nts_send_state="전송완료",
                    line_items=line_items,
                )
            )

    sale_tax_services = await NationalTaxService.objects.abulk_create(
        sale_tax_service_objects
    )
    print(
        "🐍 File: tax/api.py | Line: 591 | undefined ~ sale_tax_services",
        sale_tax_services,
    )

    purchase_tax_service_objects = []

    if purchase_result.SimpleTaxInvoiceExList is not None:
        # 매입 세금계산서가 존재하는 경우 sync 처리
        for purchase in purchase_result.SimpleTaxInvoiceExList.SimpleTaxInvoiceEx:
            if purchase.NTSSendKey in existing_purchases:
                continue
            # GetTaxInvoiceNK(국세청 승인번호로 세금계산서 조회) API 호출
            certKey = settings.BAROBILL_CERT_KEY
            corpNum = factory.business_registration_number
            ntsConfirmNum = purchase.NTSSendKey

            invoice_detail = settings.BAROBILL_CLIENT.service.GetTaxInvoiceNK(
                CERTKEY=certKey,
                CorpNum=corpNum,
                NTSConfirmNum=ntsConfirmNum,
            )

            if invoice_detail.TaxInvoiceType < 0:  # 호출 실패
                raise HttpError(
                    400,
                    f"바로빌 API 오류 - 세금계산서 상세 조회: {barobill_error_codes.get(invoice_detail.TaxInvoiceType, 'Unknown Error')}",
                )

            line_items = []
            for idx, item in enumerate(
                invoice_detail.TaxInvoiceTradeLineItems.TaxInvoiceTradeLineItem, start=1
            ):
                line_items.append(
                    {
                        "id": idx,
                        "purchase_expiry": item.PurchaseExpiry,
                        "product_id": None,
                        "name": item.Name,
                        "code": None,
                        "information": item.Information,
                        "chargeable_unit": item.ChargeableUnit,
                        "unit_price": item.UnitPrice,
                        "amount": item.Amount,
                        "tax": item.Tax,
                        "description": item.Description,
                        "material_history": None,
                    }
                )

            # 매출 세금계산서가 DB에 없으면 새로운 세금계산서 생성
            purchase_tax_service_objects.append(
                NationalTaxService(
                    user=user,
                    factory=factory,
                    publish_status="published",
                    tax_invoice_type="purchase",
                    transaction_type=barobill_purpose_types.get(
                        invoice_detail.PurposeType
                    ),
                    transaction_date=datetime.strptime(
                        invoice_detail.WriteDate, "%Y%m%d"
                    ).date(),
                    client=None,  # 거래처는 추후에 설정
                    transaction_amount=invoice_detail.AmountTotal,
                    tax_amount=invoice_detail.TaxTotal,
                    nts_send_key=sale.NTSSendKey,
                    barobill_state="발급완료",
                    nts_send_state="전송완료",
                    line_items=line_items,
                )
            )

    purchase_tax_services = await NationalTaxService.objects.abulk_create(
        purchase_tax_service_objects
    )
    print(
        "🐍 File: tax/api.py | Line: 656 | undefined ~ purchase_tax_services",
        purchase_tax_services,
    )

    return {"message": "세금계산서 동기화가 완료되었습니다."}


@router.post(
    "/",
    summary="[C] 세금계산서 생성/수정 (임시저장 지원)",
    description="국세청 API 세금계산서를 생성하거나 수정합니다. tax_id가 없으면 생성, 있으면 수정됩니다. 모든 필드가 필수가 아니므로 임시저장이 가능합니다.",
    response={
        201: NationalTaxServiceOut,
        200: NationalTaxServiceOut,
        400: dict,
        500: dict,
    },
)
async def create_or_update_tax_invoice(request, payload: NationalTaxServiceCreateIn):
    user = request.auth
    data = payload.dict()
    factory_id = data.pop("factory")
    tax_id = data.pop("tax_id", None)

    # 공장 소유권 검증
    member = await is_factory_member(factory_id, user)
    # member.role에 따라 권한 추가 검증
    factory = await get_factory_by_id(factory_id)

    # client가 선택적이므로 None일 수 있음
    client_id = data.pop("client", None)
    client = None
    client_info = {}
    if client_id is not None:
        # 거래처 ID로 거래처 조회
        client = await get_factory_client_by_id(client_id, factory_id)
        client_info = FactoryClientRowOut.from_orm(client).dict()

    if tax_id:
        # 수정 모드
        tax_service = await get_tax_service_by_id(tax_id)

        # 권한 검증
        member = await is_factory_member(tax_service.factory.id, user)

        # 발행된 세금계산서인 경우 수정 불가
        if tax_service.publish_status == "published":
            raise HttpError(400, "발행된 세금계산서는 수정할 수 없습니다.")

        # 공장 ID 검증
        if tax_service.factory.id != factory_id:
            raise HttpError(400, "세금계산서의 공장과 요청한 공장이 일치하지 않습니다.")

        # 데이터 업데이트
        if client_id is not None:
            tax_service.client = client
            tax_service.client_info = client_info

        # line_items 업데이트
        line_items = data.pop("line_items", None)
        if line_items is not None:
            tax_service.line_items = line_items

        # 나머지 필드 업데이트
        for attr, value in data.items():
            setattr(tax_service, attr, value)

        await tax_service.asave()

        # 업데이트된 세금계산서 조회
        tax_service = await NationalTaxService.objects.aget(
            id=tax_service.id,
        )

        return 200, tax_service
    else:
        # 생성 모드
        @sync_to_async
        @transaction.atomic
        def create_tax_service():
            tax_service = NationalTaxService.objects.create(
                user=user,
                factory=factory,
                factory_info=FactoryRowOut.from_orm(factory).dict(),
                client=client,
                client_info=client_info,
                barobill_state="임시저장",
                **data,
            )

            tax_service.save()
            return tax_service

        tax_service = await create_tax_service()

        tax_service = await NationalTaxService.objects.aget(
            id=tax_service.id,
        )

        return 201, tax_service


@router.get(
    "/{tax_id}",
    summary="[C] 세금계산서 상세 조회",
    description="세금계산서 상세 정보를 조회합니다.",
    response={200: NationalTaxServiceOut, 404: dict, 500: dict},
)
async def get_tax_invoice(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함
    return tax_service


@router.patch(
    "/{tax_id}",
    summary="[C] 세금계산서 수정",
    description="국세청 API 세금계산서를 수정합니다. (임시저장 가능)",
    response={200: NationalTaxServiceOut, 400: dict, 404: dict, 500: dict},
)
async def update_tax_invoice(request, tax_id: int, payload: NationalTaxServiceUpdateIn):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함

    data = payload.dict(exclude_unset=True)

    # 발행된 세금계산서인 경우 isHidden 필드만 수정 가능
    if tax_service.publish_status == "published":
        # isHidden 필드만 허용하고 다른 필드는 제거
        allowed_fields = {"is_hidden"}
        data = {k: v for k, v in data.items() if k in allowed_fields}

        if not data:
            raise HttpError(
                400, "발행된 세금계산서는 isHidden 필드만 수정할 수 있습니다."
            )

    factory_id = data.pop("factory", None)
    if factory_id is not None:
        # 공장 소유권 검증
        if factory_id != tax_service.factory.id:
            raise HttpError(400, "세금계산서의 공장과 요청한 공장이 일치하지 않습니다.")

    client_id = data.pop("client", None)
    if client_id is not None:
        client = await get_factory_client_by_id(
            client_id, factory_id or tax_service.factory.id
        )
        tax_service.client = client
        tax_service.client_info = FactoryClientRowOut.from_orm(client).dict()

    # line_items는 수정 시에만 업데이트
    line_items = data.pop("line_items", None)
    if line_items is not None:
        tax_service.line_items = line_items

    for attr, value in data.items():
        setattr(tax_service, attr, value)

    await tax_service.asave()

    tax_service = await NationalTaxService.objects.aget(
        id=tax_service.id,
    )

    return tax_service


@router.delete(
    "/{tax_id}",
    summary="[C] 세금계산서 삭제",
    description="국세청 API 세금계산서를 삭제합니다.",
    response={204: None, 404: dict, 500: dict},
)
async def delete_tax_invoice(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함

    await tax_service.adelete()
    return 204, None


@router.post(
    "/{tax_id}/publish",
    summary="[C] 세금계산서 발행",
    description="국세청 API 세금계산서를 발행합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def publish_tax_invoice(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    factory = tax_service.factory
    member = await is_factory_member(factory.id, user)
    # 멤버 권한 검증 추가해야함

    # 세금계산서가 발행 상태가 아니면 오류
    if tax_service.publish_status != "temporary":
        raise HttpError(400, "세금계산서를 발행할 수 있는 상태가 아닙니다.")

    # 발행 전 필수 필드 검증
    required_fields = {
        "client": "거래처",
        "transaction_date": "거래일자",
        "transaction_amount": "공급가액",
        "tax_amount": "세액",
        "line_items": "품목 리스트",
    }

    missing_fields = []
    for field, field_name in required_fields.items():
        if not getattr(tax_service, field):
            missing_fields.append(field_name)

    if missing_fields:
        raise HttpError(
            400,
            f"세금계산서 발행을 위해 다음 필드들이 필요합니다: {', '.join(missing_fields)}",
        )

    # line_items의 각 품목에 대한 필수 필드 검증
    if tax_service.line_items:
        for i, item in enumerate(tax_service.line_items):
            item_required_fields = {
                "name": "품목명",
                "chargeable_unit": "수량",
                "unit_price": "단가",
                "amount": "공급가액",
                "tax": "세액",
            }

            item_missing_fields = []
            for field, field_name in item_required_fields.items():
                if not item.get(field):
                    item_missing_fields.append(field_name)

            if item_missing_fields:
                raise HttpError(
                    400,
                    f"품목 {i+1}번에 다음 필드들이 필요합니다: {', '.join(item_missing_fields)}",
                )

    # 바로빌 API
    issue_barobill_tax_invoice(
        tax_service, tax_service.factory, tax_service.client, user
    )

    # 바로빌 API 호출 후 세금계산서 상태 업데이트, 국세청 발급번호 업데이트 필요?!

    # 발행 상태 업데이트
    tax_service.publish_status = "published"
    tax_service.barobill_state = "발급완료"  # 3014
    tax_service.nts_send_state = "전송전"  # 1
    await tax_service.asave()

    project = await tax_service.projects.afirst()

    # 웹소켓 알림
    if tax_service.tax_invoice_type == "sales":
        result = await send_notification_to_factory(
            factory_id=factory.id,
            notification_type="information",
            notification_case="sales_tax_invoice_published",
            content=f"{project.name if project else 'Unknown Project'} 매출 세금계산서 발행 완료",
            additional_data={"factory_id": factory.id},
        )
    elif tax_service.tax_invoice_type == "purchase":
        result = await send_notification_to_factory(
            factory_id=factory.id,
            notification_type="information",
            notification_case="purchase_tax_invoice_published",
            content=f"{project.name if project else 'Unknown Project'} 매입 세금계산서 발행 완료",
            additional_data={"factory_id": factory.id},
        )

    return {"message": "세금계산서가 발행되었습니다."}


@router.post(
    "/{tax_id}/cancel",
    summary="[C] 세금계산서 발행 취소",
    description="국세청 API 세금계산서 발행을 취소합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def cancel_tax_invoice(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함

    # 바로빌 상태 점검
    result = get_state_barobill_tax_invoice(
        tax_service.factory.business_registration_number,
        tax_service.mgt_key,
    )
    barobill_state = barobill_tax_service_states.get(result.BarobillState)
    nts_send_state = nts_tax_service_states.get(result.NTSSendState)
    if barobill_state != "발급완료" or nts_send_state != "전송전":
        raise HttpError(400, "세금계산서 발행을 취소할 수 있는 상태가 아닙니다.")

    # 발행 취소
    result = cancel_barobill_tax_invoice(
        tax_service.factory.business_registration_number,
        tax_service.mgt_key,
    )

    return {"message": "세금계산서 발행이 취소되었습니다."}


@router.get(
    "/{tax_id}/state",
    summary="[C] 세금계산서 발행 상태 조회",
    description="국세청 API 세금계산서 발행 상태를 조회합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def get_tax_invoice_state_from_barobill(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    corpNum = tax_service.factory.business_registration_number
    mgtKey = tax_service.mgt_key

    result = get_state_barobill_tax_invoice(corpNum, mgtKey)
    # TODO : 상태조회를 CronJob으로 주기적으로 실행

    return {
        "state": barobill_tax_service_states.get(result.BarobillState)
        or "Unknown State",
        "nts_state": nts_tax_service_states.get(result.NTSSendState) or "Unknown State",
    }


@router.patch(
    "/{tax_id}/connect-material-history",
    summary="[C] NEW! 세금계산서와 자재 이력 연동",
    description="세금계산서와 자재 이력을 연동합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def connect_material_history(
    request, tax_id: int, payload: TaxToMaterialHistoryIn
):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)

    if not member:
        raise HttpError(403, "권한이 없습니다.")

    # line_items 중 요청한 line_item_id가 존재하는지 확인
    line_items = tax_service.line_items or []
    matched_item = next(
        (item for item in line_items if item.get("id") == payload.line_item_id),
        None,
    )

    if not matched_item:
        raise HttpError(404, f"line_item_id {payload.line_item_id}를 찾을 수 없습니다.")

    # 이미 다른 material_history가 연동되어 있는지 확인
    if (
        matched_item.get("material_history")
        and matched_item.get("material_history") != payload.material_history_id
    ):
        raise HttpError(400, "해당 품목에는 이미 다른 자재 이력이 연동되어 있습니다.")

    # material_history 존재 여부 및 공장 일치 검증
    try:
        material_history = await MaterialHistory.objects.select_related(
            "material"
        ).aget(id=payload.material_history_id)
    except MaterialHistory.DoesNotExist:
        raise HttpError(
            404,
            f"material_history_id {payload.material_history_id}를 찾을 수 없습니다.",
        )

    if material_history.material.factory_id != tax_service.factory_id:
        raise HttpError(
            400, "자재 이력의 공장과 세금계산서의 공장이 일치하지 않습니다."
        )

    matched_item["material_history"] = payload.material_history_id
    tax_service.line_items = line_items
    await tax_service.asave()

    return {"message": "세금계산서와 자재 이력 연동이 완료되었습니다."}
