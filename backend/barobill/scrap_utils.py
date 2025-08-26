from django.conf import settings
from ninja.errors import HttpError
from barobill.barobill_error_code import barobill_error_codes


async def regist_tax_invoice_scrap(factory_business_registration_number):
    """
    홈택스 스크랩 등록
    """
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory_business_registration_number
    hometaxLoginMethod = "CERT"
    result = settings.BAROBILL_CLIENT.service.RegistTaxInvoiceScrap(
        CERTKEY=certKey,
        CorpNum=corpNum,
        HometaxLoginMethod=hometaxLoginMethod,
    )

    if result < 0:  # 호출 실패
        raise HttpError(
            400,
            f"바로빌 인증서 만료일 확인 실패: {barobill_error_codes.get(result, 'Unknown error')}",
        )

    return result
