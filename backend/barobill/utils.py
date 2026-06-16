import re
import string
import random
from django.conf import settings
from ninja.errors import HttpError
from barobill.barobill_error_code import barobill_error_codes
from datetime import datetime, date


def _generate_barobill_id(factory_id):
    """바로빌 회원 ID 생성. 바로빌 ID는 최대 20자 제한이 있어 이를 넘지 않도록 보장한다."""
    prefix = f"fx{factory_id}-"
    suffix_len = max(4, 20 - len(prefix))
    barobill_id = prefix + "".join(
        random.choices(string.ascii_lowercase + string.digits, k=suffix_len)
    )
    return barobill_id[:20]


async def add_corp_to_barobill(
    factory, barobill_id=None, barobill_password=None, grade="대표"
):
    if not barobill_id:
        barobill_id = _generate_barobill_id(factory.id)
    if not barobill_password:
        barobill_password = "".join(
            random.choices(string.ascii_letters + string.digits, k=20)
        )

    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory.business_registration_number
    corpName = factory.name
    ceoName = factory.representative_name
    bizType = factory.business_type
    bizClass = factory.business_category
    postNum = ""
    addr1 = factory.business_address
    addr2 = factory.business_address
    memberName = factory.representative_name
    id = barobill_id
    pwd = barobill_password
    tel = factory.manager_phone
    hp = ""
    email = factory.manager_email

    result = settings.BAROBILL_CLIENT.service.RegistCorp(
        CERTKEY=certKey,
        CorpNum=corpNum,
        CorpName=corpName,
        CEOName=ceoName,
        BizType=bizType,
        BizClass=bizClass,
        PostNum=postNum,
        Addr1=addr1,
        Addr2=addr2,
        MemberName=memberName,
        ID=id,
        PWD=pwd,
        Grade=grade,
        TEL=tel,
        HP=hp,
        Email=email,
    )

    if result < 0:
        raise HttpError(
            400,
            f"바로빌 기업 회원가입 실패: {barobill_error_codes.get(result, 'Unknown error')}",
        )

    return barobill_id, barobill_password


async def add_user_to_barobill(
    factory, barobill_id=None, barobill_password=None, grade="담당자"
):
    if not barobill_id:
        barobill_id = _generate_barobill_id(factory.id)
    if not barobill_password:
        barobill_password = "".join(
            random.choices(string.ascii_letters + string.digits, k=20)
        )

    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory.business_registration_number
    memberName = factory.representative_name
    id = barobill_id
    pwd = barobill_password
    tel = factory.manager_phone
    hp = ""
    email = factory.manager_email

    result = settings.BAROBILL_CLIENT.service.AddUserToCorp(
        CERTKEY=certKey,
        CorpNum=corpNum,
        MemberName=memberName,
        ID=id,
        PWD=pwd,
        Grade=grade,
        TEL=tel,
        HP=hp,
        Email=email,
    )

    if result < 0:
        raise HttpError(
            400,
            f"바로빌 기업 회원가입 실패: {barobill_error_codes.get(result, 'Unknown error')}",
        )

    return barobill_id, barobill_password


async def check_barobill_cert(factory_business_registration_number):
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory_business_registration_number
    result = settings.BAROBILL_CLIENT.service.CheckCERTIsValid(
        CERTKEY=certKey,
        CorpNum=corpNum,
    )
    if result < 0:
        raise HttpError(
            400,
            f"바로빌 인증서 유효성 검사 실패: {barobill_error_codes.get(result, 'Unknown error')}",
        )

    return result


async def check_barobill_expire_date(factory_business_registration_number):
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory_business_registration_number
    result = settings.BAROBILL_CLIENT.service.GetCertificateExpireDate(
        CERTKEY=certKey,
        CorpNum=corpNum,
    )
    if re.compile("^-[0-9]{5}$").match(result) is not None:
        raise HttpError(
            400,
            f"바로빌 인증서 만료일 확인 실패: {barobill_error_codes.get(result, 'Unknown error')}",
        )

    # result 예시 2026-02-13
    now = date.today()
    expire_date = datetime.strptime(result, "%Y-%m-%d").date()
    if expire_date < now:
        raise HttpError(400, "바로빌 인증서가 만료되었습니다.")

    return result
