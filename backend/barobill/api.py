from ninja import Router
from api.security import jwt_auth
from django.conf import settings
from factory.utils import get_factory_by_id
from barobill.schemas.inbound import BarobillCorpRegisterIn


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
    grade = "담당자"
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
