from django.conf import settings
from ninja.errors import HttpError
from tax.models import TransactionType
from tax.tax_document import get_barobill_tax_document_fields
from barobill.barobill_error_code import barobill_error_codes


def issue_barobill_tax_invoice(tax_service, factory, client, user):
    certKey = settings.BAROBILL_CERT_KEY
    tax_document_fields = get_barobill_tax_document_fields(
        tax_type=tax_service.tax_type,
        document_kind=tax_service.document_kind,
        tax_amount=tax_service.tax_amount,
    )
    taxInvoice = settings.BAROBILL_CLIENT.get_type("ns0:TaxInvoice")(
        IssueDirection=1,
        TaxInvoiceType=tax_document_fields.tax_invoice_type,
        ModifyCode="",
        TaxType=tax_document_fields.tax_type,
        # BaroBill's TaxCalcType code meanings have not yet been confirmed.
        # Preserve the existing integration's value until vendor confirmation.
        TaxCalcType=1,
        PurposeType=1 if tax_service.transaction_type == TransactionType.receipt else 2,
        WriteDate=tax_service.transaction_date.strftime("%Y%m%d"),
        AmountTotal=str(tax_service.transaction_amount),
        TaxTotal=str(tax_service.tax_amount),
        TotalAmount=str(tax_service.transaction_amount + tax_service.tax_amount),
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
        # 발행자 정보
        InvoicerParty=settings.BAROBILL_CLIENT.get_type("ns0:InvoiceParty")(
            MgtNum=tax_service.mgt_key,
            CorpNum=factory.business_registration_number,
            TaxRegID="",
            CorpName=factory.name,
            CEOName=factory.representative_name,
            Addr=factory.business_address,
            BizClass=factory.business_category,
            BizType=factory.business_type,
            ContactID=user.barobill_user_id,
            # ContactName=user.name,  # 담당자 이름 필드 없음
            ContactName=factory.representative_name,  # 담당자 이름 필드 없음
            TEL="",
            HP="",
            Email=factory.manager_email,
        ),
        # 공급자 정보
        InvoiceeParty=settings.BAROBILL_CLIENT.get_type("ns0:InvoiceParty")(
            MgtNum=tax_service.mgt_key,
            CorpNum=client.business_registration_number,
            TaxRegID="",  # 종사업장식별번호
            CorpName=client.name,
            CEOName=client.representative_name,
            Addr=client.address,
            BizClass=client.business_category,
            BizType=client.business_type,
            ContactID="",
            ContactName=client.manager,
            TEL="",
            HP="",
            Email="",
        ),
        # 발행내역
        TaxInvoiceTradeLineItems=settings.BAROBILL_CLIENT.get_type(
            "ns0:ArrayOfTaxInvoiceTradeLineItem"
        )(
            [
                settings.BAROBILL_CLIENT.get_type("ns0:TaxInvoiceTradeLineItem")(
                    PurchaseExpiry=item.get("purchase_expiry"),
                    Name=item.get("name"),
                    Information=item.get("information"),
                    ChargeableUnit=item.get("chargeable_unit"),
                    UnitPrice=item.get("unit_price"),
                    Amount=item.get("amount"),
                    Tax=item.get("tax"),
                    Description=item.get("description"),
                )
                for item in tax_service.line_items
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
        raise HttpError(
            400,
            f"바로빌 세금계산서 발행 실패: {barobill_error_codes.get(result, 'Unknown error')}",
        )

    return result


def get_state_barobill_tax_invoice(business_registration_number, mgt_key):
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = business_registration_number
    mgtKey = mgt_key

    result = settings.BAROBILL_CLIENT.service.GetTaxInvoiceStateEX(
        CERTKEY=certKey,
        CorpNum=corpNum,
        MgtKey=mgtKey,
    )

    if result.BarobillState < 0:  # 호출 실패
        raise HttpError(
            400,
            f"바로빌 API 오류 - 세금계산서 상태 조회: {barobill_error_codes.get(result.BarobillState, 'Unknown Error')}",
        )

    return result


def cancel_barobill_tax_invoice(business_registration_number, mgt_key):
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = business_registration_number
    mgtKey = mgt_key
    procType = "ISSUE_CANCEL"  # 바로빌 상태(발급완료) 된 세금계산서를 공급자가 취소하는 경우 (국세청 전송 전에만 가능)
    memo = ""

    result = settings.BAROBILL_CLIENT.service.ProcTaxInvoice(
        CERTKEY=certKey,
        CorpNum=corpNum,
        MgtKey=mgtKey,
        ProcType=procType,
        Memo=memo,
    )

    if result < 0:  # 호출 실패
        raise HttpError(
            400,
            f"바로빌 API 오류 - 세금계산서 발행 취소: {barobill_error_codes.get(result, 'Unknown Error')}",
        )
    return result
