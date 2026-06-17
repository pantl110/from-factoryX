from ninja import Router
from ninja.errors import HttpError
from api.security import jwt_auth
from django.conf import settings
from factory.utils import get_factory_by_id
from barobill.schemas.inbound import (
    BarobillRegisterIn,
    BarobillCorpRegisterIn,
    BarobillCorpCertIn,
)
import re
from barobill.utils import (
    add_corp_to_barobill,
    add_user_to_barobill,
    check_barobill_cert,
    check_barobill_expire_date,
)
from factory.utils import is_factory_member
from factory.models import FactoryMember


router = Router(tags=["Barobill"])


@router.post(
    "/register",
    summary="[C] 바로빌 회원 자동 등록(랜덤ID, PW)",
    description="바로빌 회원 자동 등록을 위한 API입니다. 랜덤 ID와 비밀번호를 생성하여 바로빌에 회원을 등록합니다.",
    auth=jwt_auth,
)
async def register_barobill_user(request, payload: BarobillRegisterIn):
    user = request.auth
    factory = await get_factory_by_id(payload.factory, user)
    factory_member = await is_factory_member(factory.id, user)

    if factory_member.is_barobill_user:
        return {"message": "이미 바로빌 회원입니다."}

    if factory_member.role == FactoryMember.FactoryMemberType.admin:
        barobill_id, barobill_password = await add_corp_to_barobill(factory=factory)
    elif factory_member.role == FactoryMember.FactoryMemberType.manager:
        barobill_id, barobill_password = await add_user_to_barobill(factory=factory)
    else:
        raise HttpError(403, "권한이 없습니다.")

    # 바로빌 사용자 ID를 현재 사용자에 저장
    user.barobill_user_id = barobill_id
    await user.asave()
    # 바로빌 회원정보저장
    factory_member.barobill_id = barobill_id
    factory_member.barobill_password = barobill_password
    factory_member.is_barobill_user = True
    await factory_member.asave()

    return {"message": "바로빌 회원가입이 성공적으로 완료되었습니다."}


@router.post(
    "/register/corp",
    summary="[C] 바로빌 기업 회원가입",
    description="바로빌 기업 회원가입을 위한 API입니다. 기업 인증서 키를 사용하여 기업 정보를 등록합니다.",
    auth=jwt_auth,
)
async def register_corp(request, payload: BarobillCorpRegisterIn):
    user = request.auth
    factory = await get_factory_by_id(payload.factory, user)
    factory_member = await is_factory_member(factory.id, user)

    if factory_member.is_barobill_user:
        return {"message": "이미 바로빌 회원입니다."}

    barobill_id, barobill_password = await add_corp_to_barobill(
        factory=factory,
        barobill_id=payload.barobill_id,
        barobill_password=payload.barobill_password,
        grade=payload.grade,
    )

    # 바로빌 사용자 ID를 현재 사용자에 저장
    user.barobill_user_id = payload.barobill_id
    await user.asave()

    # 바로빌 회원정보저장
    factory_member.barobill_id = barobill_id
    factory_member.barobill_password = barobill_password
    factory_member.is_barobill_user = True
    await factory_member.asave()

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
    factory_member = await is_factory_member(factory.id, user)

    if factory_member.is_barobill_user:
        return {"message": "이미 바로빌 회원입니다."}

    await add_user_to_barobill(
        factory=factory,
        barobill_id=payload.barobill_id,
        barobill_password=payload.barobill_password,
        grade=payload.grade,
    )
    # 바로빌 사용자 ID를 현재 사용자에 저장
    user.barobill_user_id = payload.barobill_id
    await user.asave()
    # 바로빌 사용자 ID를 현재 사용자에 저장
    factory_member.barobill_id = payload.barobill_id
    factory_member.barobill_password = payload.barobill_password
    factory_member.is_barobill_user = True
    await factory_member.asave()

    return {"message": "바로빌 기업 회원가입이 성공적으로 완료되었습니다."}


@router.post(
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


@router.get(
    "/check/cert/{factory_id}",
    summary="[C] 바로빌 기업 인증서 등록 여부 확인",
    description="바로빌 기업 인증서 등록 여부를 확인하는 API입니다.",
    auth=jwt_auth,
)
async def get_check_barobill_cert(request, factory_id: int):
    user = request.auth
    factory = await get_factory_by_id(factory_id, user)
    factory_member = await is_factory_member(factory.id, user)

    has_cert = await check_barobill_cert(factory.business_registration_number)
    return {
        "message": "바로빌 기업 인증서 등록 여부 확인",
        "has_cert": has_cert,
        "is_valid": has_cert,  # 하위호환
    }


@router.get(
    "/check/cert/{factory_id}/expire-date",
    summary="[C] 바로빌 기업 인증서 만료일 확인",
    description="바로빌 기업 인증서 만료일자를 확인하는 API입니다.",
    auth=jwt_auth,
)
async def get_check_barobill_cert_expire_date(request, factory_id: int):
    user = request.auth
    factory = await get_factory_by_id(factory_id, user)
    factory_member = await is_factory_member(factory.id, user)

    result = await check_barobill_expire_date(factory.business_registration_number)
    return {"message": "바로빌 기업 인증서 만료일 확인", "expire_date": result}
