from ninja import Router
from ninja.errors import HttpError
from api.security import jwt_auth
from barobill.schemas.inbound import (
    BarobillCorpCertIn,
    BarobillGetPeriodIn,
    BarobillCashBillIssueIn,
)
from factory.utils import get_factory_by_id
from django.conf import settings


router = Router(tags=["Barobill Cash Bill"])


@router.post(
    "/issue",
    summary="[C] 바로빌 현금영수증 발행",
    description="바로빌 현금영수증 발행을 위한 API입니다. 기업 인증서 키를 사용하여 현금영수증을 발행합니다.",
    auth=jwt_auth,
)
async def issue_cash_bill(request, payload: BarobillCashBillIssueIn):
    user = request.auth
    factory = await get_factory_by_id(payload.factory, user)
    certKey = settings.BAROBILL_CERT_KEY
    userId = user.barobill_user_id

    # factory-x 현금영수증 모델 생성

    cashBill = settings.BAROBILL_CLIENT.get_type("ns0:CashBillEx")(
        MgtKey="0000001",  # 관리 키(현금영수증 모델 id 활용)
        FranchiseCorpNum=factory.business_registration_number,
        FranchiseMemberID=userId,
        FranchiseCorpName=factory.name,
        FranchiseCEOName=factory.representative_name,
        FranchiseAddr=factory.business_address,
        FranchiseTel=factory.manager_phone,
        IdentityNum=payload.identity_num,
        HP="",
        Fax="",
        Email="",
        TradeDate=payload.trade_date.strftime("%Y%m%d"),
        TradeType="N",
        TradeUsage="1",
        TradeDeductionType="",
        TradeMethod=payload.trade_method,
        ItemName=payload.item_name,
        Amount=payload.amount,
        Tax=payload.tax,
        ServiceCharge="0",
        CancelType="",
        CancelNTSConfirmNum="",
        CancelNTSConfirmDate="",
    )
    smsSendYN = False
    mailTitle = ""

    result = settings.BAROBILL_CLIENT.service.RegistAndIssueCashBill(
        CERTKEY=certKey,
        CorpNum=cashBill.FranchiseCorpNum,
        UserID=userId,
        Invoice=cashBill,
        SMSSendYN=smsSendYN,
        MailTitle=mailTitle,
    )

    if result < 0:  # 호출 실패
        raise HttpError(400, f"바로빌 현금영수증 발행 실패: {result}")

    return {"message": "바로빌 현금영수증이 성공적으로 발행되었습니다."}


@router.get(
    "/purchase/period",
    summary="[C] 바로빌 매입 현금영수증 발행 기간 조회",
    description="바로빌 매입 현금영수증 발행 기간을 조회하는 API입니다.",
    auth=jwt_auth,
)
async def get_purchase_cash_bill_period(request, payload: BarobillGetPeriodIn):
    user = request.auth
    factory = await get_factory_by_id(payload.factory, user)
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory.business_registration_number
    userId = ""
    startDate = payload.start_date.strftime("%Y%m%d")
    endDate = payload.end_date.strftime("%Y%m%d")
    countPerPage = payload.page_size
    currentPage = payload.page
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

    if result.CurrentPage < 0:  # 호출 실패
        raise HttpError(400, f"바로빌 현금영수증 발행 기간 조회 실패: {result}")
    else:  # 호출 성공
        print(result.CurrentPage)
        print(result.CountPerPage)
        print(result.MaxPageNum)
        print(result.MaxIndex)

        simpleCashbills = (
            [] if result is None else result.SimpleCashBillExList.SimpleCashBillEx
        )

        for simpleCashbill in simpleCashbills:
            # 필드정보는 레퍼런스를 참고해주세요.
            print(simpleCashbill)


@router.get(
    "/sale/period",
    summary="[C] 바로빌 매출 현금영수증 발행 기간 조회",
    description="바로빌 매출 현금영수증 발행 기간을 조회하는 API입니다.",
    auth=jwt_auth,
)
async def get_sale_cash_bill_period(request, payload: BarobillGetPeriodIn):
    user = request.auth
    factory = await get_factory_by_id(payload.factory, user)
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory.business_registration_number
    userId = ""
    startDate = payload.start_date.strftime("%Y%m%d")
    endDate = payload.end_date.strftime("%Y%m%d")
    countPerPage = payload.page_size
    currentPage = payload.page
    orderDirection = 1

    result = settings.BAROBILL_CLIENT.service.GetPeriodCashBillPurchaseListEx(
        CERTKEY=certKey,
        CorpNum=corpNum,
        UserID=userId,
        StartDate=startDate,
        EndDate=endDate,
        CountPerPage=countPerPage,
        CurrentPage=currentPage,
        OrderDirection=orderDirection,
    )
