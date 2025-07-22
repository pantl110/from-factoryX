from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from factory.models import Factory, FactoryMember
from user.models import User
from factory.schemas import FactoryMemberOut, FactoryMemberUpdateIn
from typing import List
from ninja.pagination import paginate
from factory.schemas.inbound import InviteMemberIn
from datetime import datetime, timezone

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
        - invited_at: 초대한 시각(ISO8601, str)
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
            # invited_by는 User 인스턴스여야 함
            invited_by = request.user
            if not invited_by or not hasattr(invited_by, 'id'):
                raise HttpError(400, "초대한 사용자를 확인할 수 없습니다.")
            FactoryMember.objects.create(
                factory=factory,
                user=user,
                role=role,
                status=FactoryMember.MemberStatus.active,
                invited_by=invited_by
            )
            return {"message": "기존 회원을 바로 멤버로 추가했습니다."}
        except User.DoesNotExist:
            # inviting 구조 확장: [{email, role, invited_by, invited_at}]
            inviting = factory.inviting or []
            already = any(item["email"] == email for item in inviting)
            if not already:
                inviting.append({
                    "email": email,
                    "role": role,
                    "invited_by": get_user_id(request.user),
                    "invited_at": datetime.now(timezone.utc).isoformat()
                })
                factory.inviting = inviting
                factory.save()
            send_invite_email(email, factory, role)
            return {"message": "초대 메일을 발송했습니다.", "inviting": factory.inviting}
        except Exception as e:
            raise HttpError(400, f"멤버 초대 중 오류: {str(e)}")
    
    return await sync_to_async(_invite_member)()


# Factory Member Tab
@router.get(
    "",
    summary="[C] 전체 멤버 및 초대 대기자 조회",
    response=List[FactoryMemberOut]
)
@paginate
async def list_factory_members(request, factory_id: int):
    """
    입력 필드:
    - factory_id: 멤버를 조회할 팩토리 ID (필수)

    반환 필드: (FactoryMemberOut 리스트, 각 멤버별 상세 정보)
    - id: 멤버 ID (int, 미가입 초대자는 음수 또는 0)
    - factory: 팩토리 ID (int)
    - user: 유저 ID (int, 미가입 초대자는 None)
    - name: 사용자 이름 (str, 미가입 초대자는 "")
    - email: 이메일 (str)
    - role: 역할 (str, 예: admin/manager/viewer)
    - status: 상태 (str, 예: invited/active)
    - invited_at: 초대 일시 (datetime)

    동작:
    - 해당 팩토리의 모든 멤버(가입 완료된 유저)와 초대받았지만 가입하지 않은 유저를 모두 반환
    - user는 id만 반환됨(미가입 초대자는 None)
    """
    factory = await sync_to_async(Factory.objects.get)(id=factory_id)
    # 가입된 멤버
    members = await sync_to_async(lambda: list(FactoryMember.objects.filter(factory_id=factory_id).select_related("user")))()
    member_outs = [FactoryMemberOut.from_orm(m) for m in members]
    # 미가입 초대자
    inviting = factory.inviting or []
    inviting_outs = []
    for idx, item in enumerate(inviting):
        inviting_outs.append(FactoryMemberOut(
            id=-(idx+1),  # 음수 id로 구분
            factory=factory.id,
            user=None,
            name="",
            email=item.get("email", ""),
            role=item.get("role", "invited"),
            status="invited",
            invited_at=item.get("invited_at"),
        ))
    return member_outs + inviting_outs


@router.delete(
    "/{member_id}",
    summary="[C] 멤버 삭제"
)
async def delete_factory_member(request, member_id: int, factory_id: int = None):
    """
    입력 필드:
    - member_id: 삭제할 멤버의 ID (필수)
    - factory_id: (초대 대기자 삭제 시 필요, 쿼리 파라미터)

    반환 필드:
    - message: 처리 결과 메시지 (str)
    - deleted_member_id: 삭제된 멤버의 ID (int)

    동작:
    - member_id가 양수면 기존 멤버 삭제
    - member_id가 음수면 해당 factory의 inviting 리스트에서 초대 대기자 삭제
    """
    if member_id < 0:
        if not factory_id:
            raise HttpError(400, "초대 대기자 삭제 시 factory_id가 필요합니다.")
        def _delete_inviting():
            factory = Factory.objects.get(id=factory_id)
            inviting = factory.inviting or []
            idx = -member_id - 1
            if 0 <= idx < len(inviting):
                inviting.pop(idx)
                factory.inviting = inviting
                factory.save()
                return {"message": "초대 대기자가 삭제되었습니다.", "deleted_member_id": member_id}
            else:
                raise HttpError(404, "해당 초대 대기자를 찾을 수 없습니다.")
        return await sync_to_async(_delete_inviting)()
    else:
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
async def update_factory_member(request, member_id: int, payload: FactoryMemberUpdateIn, factory_id: int = None):
    """
    입력 필드:
    - member_id: 수정할 멤버의 ID (필수)
    - factory_id: (초대 대기자 수정 시 필요)
    - role: 변경할 역할 (필수)

    반환 필드:
    - id: 멤버 ID (int, 미가입 초대자는 음수 또는 0)
    - factory: 팩토리 ID (int)
    - user: 유저 ID (int, 미가입 초대자는 None)
    - role: 역할 (str)
    """
    if member_id < 0:
        if not factory_id:
            raise HttpError(400, "초대 대기자 수정 시 factory_id가 필요합니다.")
        def _update_inviting():
            factory = Factory.objects.get(id=factory_id)
            inviting = factory.inviting or []
            idx = -member_id - 1
            if 0 <= idx < len(inviting):
                inviting[idx]['role'] = payload.role
                factory.inviting = inviting
                factory.save()
                return {
                    "id": member_id,
                    "factory": factory.id,
                    "user": None,
                    "role": inviting[idx]['role'],
                }
            else:
                raise HttpError(404, "해당 초대 대기자를 찾을 수 없습니다.")
        return await sync_to_async(_update_inviting)()
    else:
        try:
            member = await sync_to_async(FactoryMember.objects.get)(id=member_id)
        except FactoryMember.DoesNotExist:
            raise HttpError(404, "해당 멤버를 찾을 수 없습니다.")
        if payload.role:
            member.role = payload.role
            await sync_to_async(member.save)()
        return {
            "id": member.id,
            "factory": member.factory_id,
            "user": member.user_id,
            "role": member.role,
        }
