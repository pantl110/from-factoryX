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
            f"바로빌 홈택스 스크랩 등록 실패: {barobill_error_codes.get(result, 'Unknown error')}",
        )

    return result


async def stop_tax_invoice_scrap(factory_business_registration_number):
    """
    홈택스 스크랩 해지
    """
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory_business_registration_number
    result = settings.BAROBILL_CLIENT.service.StopTaxInvoiceScrap(
        CERTKEY=certKey,
        CorpNum=corpNum,
    )

    if result < 0:  # 호출 실패
        raise HttpError(
            400,
            f"바로빌 홈택스 스크랩 해지 실패: {barobill_error_codes.get(result, 'Unknown error')}",
        )

    return result


async def cancel_stop_tax_invoice_scrap(factory_business_registration_number):
    """
    홈택스 스크랩 해지 취소(해지한 당 월에 사용)
    """
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory_business_registration_number
    result = settings.BAROBILL_CLIENT.service.CancelStopTaxInvoiceScrap(
        CERTKEY=certKey,
        CorpNum=corpNum,
    )

    if result < 0:  # 호출 실패
        raise HttpError(
            400,
            f"바로빌 홈택스 스크랩 해지 취소 실패: {barobill_error_codes.get(result, 'Unknown error')}",
        )

    return result


async def re_regist_tax_invoice_scrap(factory_business_registration_number):
    """
    홈택스 스크랩 재등록 취소(해지한 월이 지난 후에 사용)
    """
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory_business_registration_number
    result = settings.BAROBILL_CLIENT.service.ReRegistTaxInvoiceScrap(
        CERTKEY=certKey,
        CorpNum=corpNum,
    )

    if result < 0:  # 호출 실패
        raise HttpError(
            400,
            f"바로빌 홈택스 스크랩 재등록 실패: {barobill_error_codes.get(result, 'Unknown error')}",
        )

    return result
