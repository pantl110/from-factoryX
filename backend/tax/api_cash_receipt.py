from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from ninja import Query
from tax.schemas.outbound import (
    AllCashReceiptOut,
    CashReceiptByMaterialOut,
)
from api.security import jwt_auth
from ninja import Query
from tax.models import CashReceipt
from datetime import date
from factory.utils import get_factory_by_id
from django.conf import settings
from datetime import timedelta, date
from barobill.barobill_error_code import barobill_error_codes


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
    today = date.today()
    past_date = today - timedelta(days=200)  # 200일 전 날짜
    startDate = past_date.strftime("%Y%m%d")  # 200일 전 날짜
    endDate = today.strftime("%Y%m%d")  # 현재 날짜로 설정
    countPerPage = 100  # 최대 100건
    currentPage = 1
    orderDirection = 1

    result = settings.BAROBILL_CLIENT.service.GetPeriodCashBillSalesListEx(
        CERTKEY=certKey,
        CorpNum=corpNum,
        UserID=userId,
        StartDate=startDate,
        EndDate=endDate,
        CountPerPage=countPerPage,
        CurrentPage=currentPage,
        OrderDirection=orderDirection,
    )

    if result.CurrentPage < 0:
        error_msg = barobill_error_codes.get(result.CurrentPage, "Unknown Error")
        raise HttpError(400, f"바로빌 API 오류 - 매출 세금계산서 조회: {error_msg}")

    if result.SimpleCashBillExList is not None:
        # 매출 현금영수증이 존재하는 경우 sync 처리
        for cash_receipt in result.SimpleCashBillExList.SimpleCashBillEx:
            print(
                "🐍 File: tax/api.py | Line: 507 | undefined ~ cash_receipt",
                cash_receipt,
            )


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
    """
    입력 필드(쿼리 파라미터):
    - factory_id: 공장 ID (필수)
    - q: 거래처명 또는 품목명 통합 검색어 (선택)
    - start_date: 조회 시작일 (YYYY-MM-DD, 선택)
    - end_date: 조회 종료일 (YYYY-MM-DD, 선택)
    - order: 작성일자 정렬(desc: 최신순, asc: 오래된순, 기본값 desc)

    반환 필드(각 영수증별 dict):
    - id: 영수증 ID (int)
    - transaction_date: 거래일자 (str, ISO8601)
    - client_name: 업체명 (str)
    - product_names: 품목명 리스트 (List[str])
    - transaction_amount: 공급가액 (int)
    - tax_amount: 세액 (int)
    - total_amount: 합계금액 (int)
    """
    try:

        @sync_to_async
        def get_filtered_receipts():
            qs = CashReceipt.objects.filter(
                client__factory_id=factory_id
            ).prefetch_related("client", "product")
            if q:
                ids_client = list(
                    qs.filter(client__name__icontains=q).values_list("id", flat=True)
                )
                ids_product = list(
                    qs.filter(product__name__icontains=q).values_list("id", flat=True)
                )
                ids = set(ids_client) | set(ids_product)
                qs = qs.filter(id__in=ids)
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
            product_names = [product.name for product in receipt.product.all()]
            total_amount = receipt.transaction_amount + receipt.tax_amount
            result.append(
                AllCashReceiptOut(
                    id=receipt.id,
                    transaction_date=receipt.transaction_date,
                    client_name=receipt.client.name,
                    product_names=product_names,
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
    response={200: CashReceiptByMaterialOut, 404: dict, 500: dict},
)
async def get_cash_receipt_by_material_history(request, material_history_id: int):
    """
    입력 필드(쿼리 파라미터):
    - material_history_id: 원자재 이력 ID (필수)

    반환 필드(dict):
    - transaction_date: 거래일자 (date)
    - approval_number: 승인번호 (str)
    - transaction_classification: 거래구분 (str)
    - transaction_purpose: 거래용도 (str)
    - client_name: 업체명 (str)
    - business_registration_number: 사업자등록번호 (str)
    - representative_name: 대표자명 (str/null)
    - address: 사업장 주소 (str/null)
    - materials: 구매 자재 정보 리스트(List[dict], 1건)
      - material_name: 자재명 (str)
      - unit: 단위 (str)
      - quantity: 수량 (int)
      - price: 단가 (int)
      - transaction_amount: 공급가액 (int)
      - tax_amount: 세액 (int)
      - total_amount: 합계금액 (int)
    """
    from stock.models import MaterialHistory

    try:

        def get_receipt_data(material_history_id):
            try:
                h = MaterialHistory.objects.select_related(
                    "cash_receipt", "material", "client"
                ).get(id=material_history_id)
            except MaterialHistory.DoesNotExist:
                return None
            receipt = h.cash_receipt
            if not receipt:
                return None
            client = receipt.client
            total_amount = receipt.transaction_amount + receipt.tax_amount
            return dict(
                transaction_date=receipt.transaction_date,
                approval_number=receipt.approval_number,
                transaction_classification=receipt.transaction_classification,
                transaction_purpose=receipt.transaction_purpose,
                client_name=client.name,
                business_registration_number=client.business_registration_number,
                representative_name=client.representative_name,
                address=client.address,
                materials=[
                    dict(
                        material_name=h.material.name,
                        unit=h.material.unit,
                        quantity=h.quantity,
                        price=h.price or 0,
                        transaction_amount=receipt.transaction_amount,
                        tax_amount=receipt.tax_amount,
                        total_amount=total_amount,
                    )
                ],
            )

        raw_data = await sync_to_async(get_receipt_data)(material_history_id)
        if not raw_data:
            raise HttpError(404, "해당 이력에 연결된 현금영수증이 없습니다.")
        return CashReceiptByMaterialOut(**raw_data)
    except Exception as e:
        raise HttpError(500, f"자재 이력별 현금영수증 조회 중 오류: {e}")
