from ninja import Router
from ninja.errors import HttpError
from api.security import jwt_auth
from barobill.schemas.inbound import (
    BarobillCorpCertIn,
    BarobillGetPeriodIn,
    BarobillTaxInvoiceIssueIn,
)
from factory.utils import get_factory_by_id
from django.conf import settings


router = Router(tags=["Barobill Tax"])


@router.post(
    "/issue",
    summary="[C] 바로빌 세금계산서 발행",
    description="바로빌 세금계산서 발행을 위한 API입니다. 기업 인증서 키를 사용하여 세금계산서를 발행합니다.",
    auth=jwt_auth,
)
async def issue_tax_invoice(request, payload: BarobillTaxInvoiceIssueIn):
    user = request.auth
    factory = await get_factory_by_id(
        payload.factory, user
    )  # 공장 정보 조회(멤버 검증)

    # 세금계산서 모델 생성

    certKey = settings.BAROBILL_CERT_KEY
    taxInvoice = settings.BAROBILL_CLIENT.get_type("ns0:TaxInvoice")(
        IssueDirection=1,
        TaxInvoiceType=1,
        ModifyCode="",
        TaxType=1,
        TaxCalcType=1,
        PurposeType=payload.purpose_type,
        WriteDate=payload.write_date.strftime("%Y%m%d"),
        AmountTotal=payload.amount_total,
        TaxTotal=payload.tax_total,
        TotalAmount=payload.amount_total + payload.tax_total,
        Cash="",
        ChkBill="",
        Note="",
        Credit="",
        Remark1="",
        Remark2="",
        Remark3="",
        Kwon="",
        Ho="",
        SerialNum="",
        InvoicerParty=settings.BAROBILL_CLIENT.get_type("ns0:InvoiceParty")(
            MgtNum="",  # 관리 키(세금계산서 모델 id 활용)
            CorpNum=factory.business_registration_number,
            TaxRegID="",
            CorpName=factory.name,
            CEOName=factory.representative_name,
            Addr=factory.business_address,
            BizClass=factory.business_category,
            BizType=factory.business_type,
            ContactID=user.barobill_user_id,
            ContactName=user.name,  # 담당자 이름
            TEL="",
            HP="",
            Email=factory.manager_email,
        ),
        InvoiceeParty=settings.BAROBILL_CLIENT.get_type("ns0:InvoiceParty")(
            MgtNum="",
            CorpNum="",
            TaxRegID="",
            CorpName="",
            CEOName="",
            Addr="",
            BizClass="",
            BizType="",
            ContactID="",
            ContactName="",
            TEL="",
            HP="",
            Email="",
        ),
        BrokerParty=settings.BAROBILL_CLIENT.get_type("ns0:InvoiceParty")(
            MgtNum="",
            CorpNum="",
            TaxRegID="",
            CorpName="",
            CEOName="",
            Addr="",
            BizClass="",
            BizType="",
            ContactID="",
            ContactName="",
            TEL="",
            HP="",
            Email="",
        ),
        TaxInvoiceTradeLineItems=settings.BAROBILL_CLIENT.get_type(
            "ns0:ArrayOfTaxInvoiceTradeLineItem"
        )(
            [
                settings.BAROBILL_CLIENT.get_type("ns0:TaxInvoiceTradeLineItem")(
                    PurchaseExpiry="",
                    Name="",
                    Information="",
                    ChargeableUnit="",
                    UnitPrice="",
                    Amount="",
                    Tax="",
                    Description="",
                ),
                settings.BAROBILL_CLIENT.get_type("ns0:TaxInvoiceTradeLineItem")(
                    PurchaseExpiry="",
                    Name="",
                    Information="",
                    ChargeableUnit="",
                    UnitPrice="",
                    Amount="",
                    Tax="",
                    Description="",
                ),
            ]
        ),
    )

    sendSms = True
    forceIssue = False
    mailTitle = ""

    result = settings.BAROBILL_CLIENT.service.RegistAndIssueTaxInvoice(
        CERTKEY=certKey,
        CorpNum=taxInvoice.InvoicerParty.CorpNum,
        Invoice=taxInvoice,
        SendSMS=sendSms,
        ForceIssue=forceIssue,
        MailTitle=mailTitle,
    )

    if result < 0:  # 호출 실패
        raise HttpError(400, f"바로빌 세금계산서 발행 실패: {result}")

    return {"message": "바로빌 세금계산서가 성공적으로 발행되었습니다."}


@router.get(
    "/purchase/period",
    summary="[C] 바로빌 매입 세금계산서 발행 기간 조회",
    description="바로빌 매입 세금계산서 발행 기간을 조회하는 API입니다.",
    auth=jwt_auth,
)
async def get_tax_invoice_purchase_period(request, payload: BarobillGetPeriodIn):
    user = request.auth
    factory = await get_factory_by_id(payload.factory, user)
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory.business_registration_number
    userId = "updowney"
    taxType = 1
    dateType = 1
    startDate = payload.start_date.strftime("%Y%m%d")
    endDate = payload.end_date.strftime("%Y%m%d")
    countPerPage = payload.page_size
    currentPage = payload.page

    result = settings.BAROBILL_CLIENT.service.GetPeriodTaxInvoicePurchaseList(
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

    if result.CurrentPage < 0:  # 호출 실패
        raise HttpError(
            400, f"바로빌 매입 세금계산서 발행 기간 조회 실패: {result.CurrentPage}"
        )
    else:  # 호출 성공
        print(result.CurrentPage)
        print(result.CountPerPage)
        print(result.MaxPageNum)
        print(result.MaxIndex)

        simpleTaxInvoices = (
            [] if result is None else result.SimpleTaxInvoiceExList.SimpleTaxInvoiceEx
        )

        for simpleTaxInvoice in simpleTaxInvoices:
            # 필드정보는 레퍼런스를 참고해주세요.
            print(simpleTaxInvoice)


@router.get(
    "/sale/period",
    summary="[C] 바로빌 매출 세금계산서 발행 기간 조회",
    description="바로빌 매출 세금계산서 발행 기간을 조회하는 API입니다.",
    auth=jwt_auth,
)
async def get_tax_invoice_sale_period(request, payload: BarobillGetPeriodIn):
    user = request.auth
    factory = await get_factory_by_id(payload.factory, user)
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory.business_registration_number
    userId = "updowney"
    taxType = 1
    dateType = 1
    startDate = payload.start_date.strftime("%Y%m%d")
    endDate = payload.end_date.strftime("%Y%m%d")
    countPerPage = payload.page_size
    currentPage = payload.page

    result = settings.BAROBILL_CLIENT.service.GetPeriodTaxInvoiceSalesList(
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

    if result.CurrentPage < 0:  # 호출 실패
        raise HttpError(
            400, f"바로빌 매출 세금계산서 발행 기간 조회 실패: {result.CurrentPage}"
        )
    else:  # 호출 성공
        print(result.CurrentPage)
        print(result.CountPerPage)
        print(result.MaxPageNum)
        print(result.MaxIndex)

        simpleTaxInvoices = (
            [] if result is None else result.SimpleTaxInvoiceExList.SimpleTaxInvoiceEx
        )

        for simpleTaxInvoice in simpleTaxInvoices:
            # 필드정보는 레퍼런스를 참고해주세요.
            print(simpleTaxInvoice)
