from django.conf import settings
from ninja.errors import HttpError
from tax.models import TransactionType
from barobill.barobill_error_code import barobill_error_codes


def issue_barobill_tax_invoice(tax_service, factory, client, user):
    certKey = settings.BAROBILL_CERT_KEY
    taxInvoice = settings.BAROBILL_CLIENT.get_type("ns0:TaxInvoice")(
        IssueDirection=1,
        TaxInvoiceType=1,
        ModifyCode="",
        TaxType=1,
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
