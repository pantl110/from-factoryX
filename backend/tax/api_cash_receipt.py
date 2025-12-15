from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from ninja import Query
from tax.schemas.outbound import (
    AllCashReceiptOut,
    CashReceiptDetailOut,
    CashReceiptDetailWithMaterialOut,
)
from tax.schemas.inbound import CashToMaterialHistoryIn
from api.security import jwt_auth
from ninja import Query
from tax.models import CashReceipt
from datetime import date
from factory.utils import get_factory_by_id
from django.conf import settings
from datetime import timedelta, date
from barobill.barobill_error_code import barobill_error_codes
from datetime import datetime
from stock.models import MaterialHistory
from factory.models import FactoryClient
from factory.schemas.outbound import FactoryRowOut, FactoryClientRowOut
from stock.schemas.outbound import ProductRowOut
from websocket.utils import send_notification_to_factory
from factory.utils import is_factory_member

router = Router(tags=["CashReceipts"], auth=jwt_auth)


@router.post(
    "/{factory_id}/sync",
    summary="[C] 현금영수증 동기화",
    description="바로빌 API를 통해 현금영수증을 동기화합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def sync_cash_receipts(request, factory_id: int):
    user = request.auth
    factory = await get_factory_by_id(factory_id)

    today = date.today()
    past_date = today - timedelta(days=200)

    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory.business_registration_number
    userId = user.barobill_user_id
    startDate = past_date.strftime("%Y%m%d")  # 200일 전 날짜
    endDate = today.strftime("%Y%m%d")  # 현재 날짜로 설정
    countPerPage = 100  # 최대 100건
    currentPage = 1
    orderDirection = 1

    # 매출 현금영수증 조회
    sale_result = (
        settings.BAROBILL_CASHBILL_CLIENT.service.GetPeriodCashBillSalesListEx(
            CERTKEY=certKey,
            CorpNum=corpNum,
            UserID=userId,
            StartDate=startDate,
            EndDate=endDate,
            CountPerPage=countPerPage,
            CurrentPage=currentPage,
            OrderDirection=orderDirection,
        )
    )

    if sale_result.CurrentPage < 0:
        error_msg = barobill_error_codes.get(sale_result.CurrentPage, "Unknown Error")
        raise HttpError(400, f"바로빌 API 오류 - 매출 세금계산서 조회: {error_msg}")

    # 매입 현금영수증 조회
    purchase_result = (
        settings.BAROBILL_CASHBILL_CLIENT.service.GetPeriodCashBillPurchaseListEx(
            CERTKEY=certKey,
            CorpNum=corpNum,
            UserID=userId,
            StartDate=startDate,
            EndDate=endDate,
            CountPerPage=countPerPage,
            CurrentPage=currentPage,
            OrderDirection=orderDirection,
        )
    )

    if purchase_result.CurrentPage < 0:
        error_msg = barobill_error_codes.get(
            purchase_result.CurrentPage, "Unknown Error"
        )
        raise HttpError(400, f"바로빌 API 오류 - 매출 세금계산서 조회: {error_msg}")

    # 기존 현금영수증 조회
    existing_sales = await sync_to_async(list)(
        CashReceipt.objects.filter(
            factory=factory,
            cash_receipt_type="sales",
        ).values_list("nts_confirm_num", flat=True)
    )
    existing_purchases = await sync_to_async(list)(
        CashReceipt.objects.filter(
            factory=factory,
            cash_receipt_type="purchase",
        ).values_list("nts_confirm_num", flat=True)
    )

    sale_cash_receipts = []

    if sale_result.SimpleCashBillExList is not None:
        # 매출 현금영수증이 존재하는 경우 sync 처리
        for cash_receipt in sale_result.SimpleCashBillExList.SimpleCashBillEx:
            if cash_receipt.NTSConfirmNum in existing_sales:
                continue

            # 현금영수증 상세 조회
            cash_receipt_detail = (
                settings.BAROBILL_CASHBILL_CLIENT.service.GetCashBillExNK(
                    CERTKEY=certKey,
                    CorpNum=corpNum,
                    UserID=userId,
                    TradeDate=cash_receipt.TradeDate,
                    NTSConfirmNum=cash_receipt.NTSConfirmNum,
                )
            )

            # 클라이언트 찾기
            try:
                client = await FactoryClient.objects.aget(
                    factory_id=factory.id,
                    business_registration_number=cash_receipt_detail.FranchiseCorpNum,
                )
            except FactoryClient.DoesNotExist:
                client = None

            sale_cash_receipts.append(
                CashReceipt(
                    user=user,
                    factory=factory,
                    factory_info=FactoryRowOut.from_orm(factory).dict(),
                    client=client,
                    client_info=(
                        FactoryClientRowOut.from_orm(client).dict() if client else {}
                    ),
                    cash_receipt_type="sales",
                    transaction_date=datetime.strptime(
                        cash_receipt.TradeDate, "%Y%m%d"
                    ).date(),
                    transaction_amount=int(cash_receipt.Amount),
                    tax_amount=int(cash_receipt.Tax),
                    service_charge=int(cash_receipt.ServiceCharge),
                    nts_confirm_num=cash_receipt.NTSConfirmNum,
                    franchise_corp_num=cash_receipt_detail.FranchiseCorpNum,
                    franchise_corp_name=cash_receipt_detail.FranchiseCorpName,
                    franchise_ceo_name=cash_receipt_detail.FranchiseCEOName,
                    franchise_addr=cash_receipt_detail.FranchiseAddr,
                    franchise_tel=cash_receipt_detail.FranchiseTel,
                    identity_num=cash_receipt_detail.IdentityNum,
                    trade_type=cash_receipt_detail.TradeType,
                    trade_usage=cash_receipt_detail.TradeUsage,
                    trade_method=cash_receipt_detail.TradeMethod,
                    item_name=cash_receipt_detail.ItemName,
                    cancel_type=cash_receipt_detail.CancelType,
                    cancel_nts_confirm_num=cash_receipt_detail.CancelNTSConfirmNum,
                    cancel_nts_confirm_date=cash_receipt_detail.CancelNTSConfirmDate,
                )
            )
        # 매출 현금영수증 저장
        sale_cash_receipts = await CashReceipt.objects.abulk_create(sale_cash_receipts)

    purchase_cash_receipts = []

    if purchase_result.SimpleCashBillExList is not None:
        # 매입 현금영수증이 존재하는 경우 sync 처리
        for cash_receipt in purchase_result.SimpleCashBillExList.SimpleCashBillEx:
            if cash_receipt.NTSConfirmNum in existing_purchases:
                continue

            # 현금영수증 상세 조회
            cash_receipt_detail = (
                settings.BAROBILL_CASHBILL_CLIENT.service.GetCashBillExNK(
                    CERTKEY=certKey,
                    CorpNum=corpNum,
                    UserID=userId,
                    TradeDate=cash_receipt.TradeDate,
                    NTSConfirmNum=cash_receipt.NTSConfirmNum,
                )
            )

            # 클라이언트 찾기
            try:
                client = await FactoryClient.objects.aget(
                    factory_id=factory.id,
                    business_registration_number=cash_receipt_detail.FranchiseCorpNum,
                )
            except FactoryClient.DoesNotExist:
                client = None

            purchase_cash_receipts.append(
                CashReceipt(
                    user=user,
                    factory=factory,
                    factory_info=FactoryRowOut.from_orm(factory).dict(),
                    client=client,
                    client_info=(
                        FactoryClientRowOut.from_orm(client).dict() if client else {}
                    ),
                    cash_receipt_type="sales",
                    transaction_date=datetime.strptime(
                        cash_receipt.TradeDate, "%Y%m%d"
                    ).date(),
                    transaction_amount=int(cash_receipt.Amount),
                    tax_amount=int(cash_receipt.Tax),
                    service_charge=int(cash_receipt.ServiceCharge),
                    nts_confirm_num=cash_receipt.NTSConfirmNum,
                    franchise_corp_num=cash_receipt_detail.FranchiseCorpNum,
                    franchise_corp_name=cash_receipt_detail.FranchiseCorpName,
                    franchise_ceo_name=cash_receipt_detail.FranchiseCEOName,
                    franchise_addr=cash_receipt_detail.FranchiseAddr,
                    franchise_tel=cash_receipt_detail.FranchiseTel,
                    identity_num=cash_receipt_detail.IdentityNum,
                    trade_type=cash_receipt_detail.TradeType,
                    trade_usage=cash_receipt_detail.TradeUsage,
                    trade_method=cash_receipt_detail.TradeMethod,
                    item_name=cash_receipt_detail.ItemName,
                    cancel_type=cash_receipt_detail.CancelType,
                    cancel_nts_confirm_num=cash_receipt_detail.CancelNTSConfirmNum,
                    cancel_nts_confirm_date=cash_receipt_detail.CancelNTSConfirmDate,
                )
            )
        # 매입 현금영수증 저장
        purchase_cash_receipts = await CashReceipt.objects.abulk_create(
            purchase_cash_receipts
        )

    # 알림 전송
    receipts = sale_cash_receipts + purchase_cash_receipts
    for cash_receipt in receipts:
        await send_notification_to_factory(
            factory_id=int(factory_id),
            notification_type="information",
            notification_case="cash_receipt_published",
            content=f"새로운 현금영수증이 등록되었습니다.",
            additional_data={},
        )

    return {
        "message": "현금영수증 동기화가 완료되었습니다.",
        "sales_count": len(sale_cash_receipts),
        "purchase_count": len(purchase_cash_receipts),
    }


@router.get(
    "",
    summary="[C] 현금영수증 검색/조회",
    description="공장, 거래처명(q), 기간, 정렬로 현금영수증 검색",
    response={200: list[AllCashReceiptOut], 400: dict, 500: dict},
)
@paginate
async def list_cash_receipts(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    q: str = Query(None, description="거래처명 또는 품목명 통합 검색어"),
    start_date: date = Query(None, description="시작일"),
    end_date: date = Query(None, description="종료일"),
    order: str = Query(
        "desc", description="작성일자 정렬: desc(최신순), asc(오래된순)"
    ),
):
    try:

        @sync_to_async
        def get_filtered_receipts():
            qs = CashReceipt.objects.filter(
                client__factory_id=factory_id
            ).prefetch_related("client")
            if q:
                ids_client = list(
                    qs.filter(client__name__icontains=q).values_list("id", flat=True)
                )
                qs = qs.filter(id__in=ids_client)
            if start_date:
                qs = qs.filter(transaction_date__gte=start_date)
            if end_date:
                qs = qs.filter(transaction_date__lte=end_date)
            if order == "asc":
                qs = qs.order_by("transaction_date")
            else:
                qs = qs.order_by("-transaction_date")
            return list(qs.distinct())

        receipts = await get_filtered_receipts()
        result = []
        for receipt in receipts:
            total_amount = receipt.transaction_amount + receipt.tax_amount
            result.append(
                AllCashReceiptOut(
                    id=receipt.id,
                    transaction_date=receipt.transaction_date,
                    client_name=receipt.client.name,
                    transaction_amount=receipt.transaction_amount,
                    tax_amount=receipt.tax_amount,
                    total_amount=total_amount,
                )
            )
        return result
    except Exception as e:
        raise HttpError(500, f"현금영수증 검색 중 오류: {e}")


@router.get(
    "/material-history",
    summary="[C] 자재 이력별 현금영수증 및 구매정보 조회",
    description="material_history_id로 현금영수증 및 자재정보를 조회",
    response=CashReceiptDetailWithMaterialOut,
)
async def get_cash_receipt_by_material_history(request, material_history_id: int):

    try:
        history = (
            await MaterialHistory.objects.select_related(
                "cash_receipt__client",
                "material",
                "client",
            )
            .prefetch_related("cash_receipt")
            .aget(id=material_history_id)
        )
    except MaterialHistory.DoesNotExist:
        raise HttpError(404, "자재 이력이 존재하지 않습니다.")

    if history.cash_receipt is None:
        raise HttpError(404, "해당 이력에 연결된 현금영수증이 없습니다.")
    return history.cash_receipt


@router.get(
    "/{cash_receipt_id}",
    summary="[C] 현금영수증 상세 조회",
    description="현금영수증 ID로 현금영수증 상세 조회",
    response=CashReceiptDetailOut,
)
async def get_cash_receipt(request, cash_receipt_id: int):
    try:
        cash_receipt = await CashReceipt.objects.select_related(
            "factory", "client"
        ).aget(id=cash_receipt_id)
    except CashReceipt.DoesNotExist:
        raise HttpError(404, "해당 현금영수증이 존재하지 않습니다.")
    return cash_receipt


@router.patch(
    "/{cash_receipt_id}/cash-to-material",
    summary="[C] 현금영수증과 자재 이력 연동",
    description="현금영수증과 자재 이력을 연동합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def cash_to_material(
    request, cash_receipt_id: int, payload: CashToMaterialHistoryIn
):
    user = request.auth
    cash_receipt = await CashReceipt.objects.aget(id=cash_receipt_id)
    member = await is_factory_member(cash_receipt.factory_id, user)
    if not member:
        raise HttpError(403, "권한이 없습니다.")

    material_history_ids = payload.material_history_id
    material_histories = await sync_to_async(list)(
        MaterialHistory.objects.filter(id__in=material_history_ids)
    )

    for material_history in material_histories:
        material_history.cash_receipt = cash_receipt
        await material_history.asave()

    return {"message": "현금영수증과 자재 이력 연동이 완료되었습니다."}


@router.patch(
    "/{cash_receipt_id}/update-material-history",
    summary="[C] 현금영수증과 자재 이력 연동 수정",
    description="현금영수증과 자재 이력 연동을 수정합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def update_material_history(
    request, cash_receipt_id: int, payload: CashToMaterialHistoryIn
):
    user = request.auth
    cash_receipt = await CashReceipt.objects.aget(id=cash_receipt_id)
    member = await is_factory_member(cash_receipt.factory_id, user)
    if not member:
        raise HttpError(403, "권한이 없습니다.")

    # 기존 연동된 자재 이력 조회
    existing_material_histories = await sync_to_async(list)(
        MaterialHistory.objects.filter(cash_receipt=cash_receipt)
    )
    existing_material_history_ids = [
        material_history.id for material_history in existing_material_histories
    ]

    # 새로운 자재 이력 조회
    material_history_ids = payload.material_history_id
    new_material_histories = await sync_to_async(list)(
        MaterialHistory.objects.filter(id__in=material_history_ids)
    )
    new_material_history_ids = [mh.id for mh in new_material_histories]

    # 비교하여 해제 및 신규 연결 처리
    to_unlink_ids = set(existing_material_history_ids) - set(new_material_history_ids)
    to_link_ids = set(new_material_history_ids) - set(existing_material_history_ids)

    # 해제: 기존에는 있었지만 새로운 payload에는 없는 자재 이력 -> cash_receipt = None
    if to_unlink_ids:
        unlink_histories = await sync_to_async(list)(
            MaterialHistory.objects.filter(id__in=list(to_unlink_ids))
        )
        for history in unlink_histories:
            history.cash_receipt = None
            await history.asave(update_fields=["cash_receipt"])

    # 연결: 새로운 payload에 포함된 자재 이력 -> cash_receipt = 현재 현금영수증
    if to_link_ids:
        link_histories = await sync_to_async(list)(
            MaterialHistory.objects.filter(id__in=list(to_link_ids))
        )
        for history in link_histories:
            history.cash_receipt = cash_receipt
            await history.asave(update_fields=["cash_receipt"])

    return {
        "message": "현금영수증과 자재 이력 연동 수정이 완료되었습니다.",
    }
