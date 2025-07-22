from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from factory.models import Factory, FactoryMember
from user.models import User
from factory.schemas import FactoryMemberOut, FactoryMemberUpdateIn
from typing import List
from ninja.pagination import paginate
from factory.schemas.inbound import InviteMemberIn

router = Router(tags=["FactoryMember"])


def send_invite_email(email, factory, role):
    print(f"[더미] {email}에게 {factory.name}({role}) 초대 메일 발송")

def get_user_id(user):
    try:
        return int(getattr(user, 'id', getattr(user, 'pk', 0)))
    except Exception:
        return 0


# Factory Member Tab
@router.post(
    "/invite",
    summary="[C] 팩토리 멤버 초대"
)
async def invite_factory_member(request, payload: InviteMemberIn):
    """
    입력 필드:
    - factory_id: 초대할 팩토리 ID (필수)
    - email: 초대할 유저 이메일 (필수)
    - role: 초대할 멤버의 역할 (필수)

    반환 필드:
    - message: 처리 결과 메시지 (str)
    - inviting: (신규 유저 초대 시) 팩토리의 초대 대기 목록 (list, 각 항목은 dict)
        - email: 초대한 이메일 (str)
        - role: 초대한 역할 (str)
        - invited_by: 초대한 사람의 user id (int)
    """
    def _invite_member():
        factory = Factory.objects.get(id=payload.factory_id)
        email = payload.email
        role = payload.role
        try:
            user = User.objects.get(email=email)
            exists = FactoryMember.objects.filter(factory=factory, user=user).exists()
            if exists:
                raise HttpError(400, "이미 해당 유저는 팩토리 멤버입니다.")
            FactoryMember.objects.create(
                factory=factory,
                user=user,
                role=role,
                status=FactoryMember.MemberStatus.active,
                invited_by=request.user
            )
            return {"message": "기존 회원을 바로 멤버로 추가했습니다."}
        except User.DoesNotExist:
            # inviting 구조 확장: [{email, role, invited_by}]
            inviting = factory.inviting or []
            already = any(item["email"] == email for item in inviting)
            if not already:
                inviting.append({
                    "email": email,
                    "role": role,
                    "invited_by": get_user_id(request.user)
                })
                factory.inviting = inviting
                factory.save()
            send_invite_email(email, factory, role)
            return {"message": "초대 메일을 발송했습니다.", "inviting": factory.inviting}
    
    return await sync_to_async(_invite_member)()


# Factory Member Tab
@router.get(
    "",
    summary="[C] 전체 멤버 조회",
    response=List[FactoryMemberOut]
)
@paginate
async def list_factory_members(request, factory_id: int):
    """
    입력 필드:
    - factory_id: 멤버를 조회할 팩토리 ID (필수)

    반환 필드: (FactoryMemberOut 리스트, 각 멤버별 상세 정보)
    - id: 멤버 ID (int)
    - factory: 팩토리 ID (int)
    - user: 유저 ID (int)
    - role: 역할 (str, 예: admin/manager/viewer)
    - status: 상태 (str, 예: invited/active)
    - invited_by: 초대한 사람의 user id (int)
    - invitation_token: 초대 토큰 (str, nullable)
    - invitation_message: 초대 메시지 (str, nullable)
    - created_at: 생성일 (datetime)
    - updated_at: 수정일 (datetime)

    동작:
    - 해당 팩토리의 모든 멤버(가입 완료된 유저) 목록 반환
    - user, invited_by는 id만 반환됨
    """
    members = await sync_to_async(lambda: list(FactoryMember.objects.filter(factory_id=factory_id).select_related("user", "invited_by")))()
    return members


@router.get(
    "/invited",
    summary="[C] 내가 초대한(미가입) 멤버 조회"
)
async def list_inviting_members(request, factory_id: int):
    """
    입력 필드:
    - factory_id: 팩토리 ID (필수)

    반환 필드:
    - inviting: 내가 초대한(아직 가입하지 않은) 멤버 목록 (list, 각 항목은 dict)
        - email: 초대한 이메일 (str)
        - role: 초대한 역할 (str)
        - invited_by: 초대한 사람의 user id (int)

    동작:
    - 팩토리의 inviting 목록 중, 현재 유저가 초대한 항목만 반환
    """
    factory = await sync_to_async(Factory.objects.get)(id=factory_id)
    user_id = get_user_id(request.user)
    inviting = [item for item in (factory.inviting or []) if item.get("invited_by") == user_id]
    return {"inviting": inviting}


@router.delete(
    "/{member_id}",
    summary="[C] 멤버 삭제"
)
async def delete_factory_member(request, member_id: int):
    """
    입력 필드:
    - member_id: 삭제할 멤버의 ID (필수)

    반환 필드:
    - message: 처리 결과 메시지 (str)
    - deleted_member_id: 삭제된 멤버의 ID (int)

    동작:
    - 해당 멤버가 존재하면 삭제, 없으면 404 에러 반환
    """
    try:
        member = await sync_to_async(FactoryMember.objects.get)(id=member_id)
    except FactoryMember.DoesNotExist:
        raise HttpError(404, "해당 멤버를 찾을 수 없습니다.")
    await sync_to_async(member.delete)()
    return {"message": "멤버가 삭제되었습니다.", "deleted_member_id": member_id}


@router.patch(
    "/{member_id}",
    summary="[C] 멤버 수정"
)
async def update_factory_member(request, member_id: int, payload: FactoryMemberUpdateIn):
    """
    입력 필드:
    - member_id: 수정할 멤버의 ID (필수)
    - role: 변경할 역할 (선택)
    - status: 변경할 상태 (선택)

    반환 필드:
    - id: 멤버 ID (int)
    - factory: 팩토리 ID (int)
    - user: 유저 ID (int)
    - role: 역할 (str)
    - status: 상태 (str)
    - invited_by: 초대한 사람의 user id (int)
    - invitation_token: 초대 토큰 (str, nullable)
    - invitation_message: 초대 메시지 (str, nullable)
    - created_at: 생성일 (datetime)
    - updated_at: 수정일 (datetime)

    동작:
    - 해당 멤버의 역할/상태를 수정
    - 멤버가 없으면 404 에러 반환
    """
    try:
        member = await sync_to_async(FactoryMember.objects.get)(id=member_id)
    except FactoryMember.DoesNotExist:
        raise HttpError(404, "해당 멤버를 찾을 수 없습니다.")
    if payload.role:
        member.role = payload.role
    if payload.status:
        member.status = payload.status
    await sync_to_async(member.save)()
    return {
        "id": member.id,
        "factory_id": member.factory_id,
        "user_id": member.user_id,
        "role": member.role,
        "status": member.status,
        "invited_by_id": member.invited_by_id,
        "created_at": member.created_at,
        "updated_at": member.updated_at,
    }
