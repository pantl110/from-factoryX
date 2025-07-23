from ninja import Router
from ninja.errors import HttpError
from api.security import jwt_auth
from django.conf import settings
from factory.utils import get_factory_by_id
from barobill.schemas.inbound import BarobillCorpRegisterIn, BarobillCorpCertIn
import re


router = Router(tags=["Barobill"])


@router.post(
    "/register/corp",
    summary="[C] 바로빌 기업 회원가입",
    description="바로빌 기업 회원가입을 위한 API입니다. 기업 인증서 키를 사용하여 기업 정보를 등록합니다.",
    auth=jwt_auth,
)
async def register_corp(request, payload: BarobillCorpRegisterIn):
    user = request.auth
    factory = await get_factory_by_id(payload.factory, user)
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
    id = payload.barobill_id
    pwd = payload.barobill_password
    grade = "대표자"
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

    # 바로빌 사용자 ID를 현재 사용자에 저장
    user.barobill_user_id = payload.barobill_id
    await user.save()

    return {"message": "바로빌 기업 회원가입이 성공적으로 완료되었습니다."}


@router.post(
    "/register/corp/user",
    summary="[C] 바로빌 기업 사용자 등록",
    description="바로빌 기업 사용자 등록을 위한 API입니다. 기업 인증서 키를 사용하여 사용자 정보를 등록합니다.",
    auth=jwt_auth,
)
async def add_user_to_corp(request, payload: BarobillCorpRegisterIn):
    user = request.auth
    factory = await get_factory_by_id(payload.factory, user)
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory.business_registration_number
    memberName = factory.representative_name
    id = payload.barobill_id
    pwd = payload.barobill_password
    grade = "담당자"
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
    return {"message": "바로빌 기업 회원가입이 성공적으로 완료되었습니다."}


@router.get(
    "/register/corp/cert",
    summary="[C] 바로빌 기업 인증서 등록 URL 조회",
    description="바로빌 기업 인증서 등록을 위한 URL을 조회하는 API입니다.",
    auth=jwt_auth,
)
async def get_corp_cert_url(request, payload: BarobillCorpCertIn):

    user = request.auth
    factory = await get_factory_by_id(payload.factory, user)
    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory.business_registration_number
    id = payload.barobill_id
    pwd = payload.barobill_password
    togo = "CERT"

    result = settings.BAROBILL_CLIENT.service.GetBaroBillURL(
        CERTKEY=certKey,
        CorpNum=corpNum,
        ID=id,
        PWD=pwd,
        TOGO=togo,
    )

    if re.compile("^-[0-9]{5}$").match(result) is not None:  # 호출 실패
        raise HttpError(400, f"바로빌 기업 인증서 등록 URL 조회 실패: {result}")
    return {
        "url": result,
        "message": "바로빌 기업 인증서 등록 URL이 성공적으로 조회되었습니다.",
    }
