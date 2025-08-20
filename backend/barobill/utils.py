import string
import random
from django.conf import settings
from ninja.errors import HttpError


async def add_corp_to_barobill(
    factory, barobill_id=None, barobill_password=None, grade="대표"
):
    if not barobill_id:
        barobill_id = "factory_" + "".join(
            random.choices(string.ascii_letters + string.digits, k=10)
        )
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
        raise HttpError(400, f"바로빌 기업 회원가입 실패: {result}")

    return barobill_id, barobill_password


async def add_user_to_barobill(
    factory, barobill_id=None, barobill_password=None, grade="담당자"
):
    if not barobill_id:
        barobill_id = "factory_" + "".join(
            random.choices(string.ascii_letters + string.digits, k=10)
        )
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
        raise HttpError(400, f"바로빌 기업 회원가입 실패: {result}")

    return barobill_id, barobill_password
