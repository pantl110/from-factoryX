from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from factory.models import Factory, FactoryMember
from user.models import User
from api.security import jwt_auth
from typing import List
from ninja.pagination import paginate
from factory.schemas.inbound import InviteMemberIn, FactoryMemberUpdateIn
from factory.schemas.outbound import FactoryMemberOut, FactoryMemberDetailOut
from datetime import datetime
from factory.utils import is_factory_member
from websocket.utils import send_notification
from typing import Optional


router = Router(tags=["FactoryMember"], auth=jwt_auth)


# Factory Member Tab
@router.post("/invite", summary="[C] 팩토리 멤버 초대")
async def invite_factory_member(request, payload: InviteMemberIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    return await sync_to_async(_invite_member)(factory_id, payload, request.auth)


def _invite_member(factory_id: str, payload: InviteMemberIn, auth_user):
    """팩토리 멤버 초대 처리"""
    factory = Factory.objects.get(id=int(factory_id))
    email = payload.email
    role = payload.role

    # 1. 이메일로 사용자 조회
    invite_user = _get_user_from_email(email)

    # 2. 이미 FactoryMember에 존재하는지 확인
    member = _is_already_factory_member(invite_user)
    if member:
        raise HttpError(400, "이미 팩토리 멤버입니다.")

    # 3. 기존 User인지 확인
    if invite_user and member is None:
        return _add_existing_user_to_factory(
            factory, invite_user, role, invited_by=auth_user
        )
    else:
        # 3. 새 사용자 초대
        return _invite_new_user(factory, email, role, invited_by=auth_user)


def _get_user_from_email(email: str) -> Optional[User]:
    """이메일로 사용자 조회"""
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None


def _is_already_factory_member(user):
    """이미 팩토리 멤버인지 확인"""
    try:
        return FactoryMember.objects.get(user=user)
    except FactoryMember.DoesNotExist:
        return None


def _add_existing_user_to_factory(factory, user, role, invited_by):
    """기존 사용자를 팩토리에 바로 추가"""
    FactoryMember.objects.create(
        factory=factory,
        user=user,
        role=role,
        status=FactoryMember.MemberStatus.active,
        invited_by=invited_by,
    )
    return {"message": "기존 회원을 바로 멤버로 추가했습니다."}


def _invite_new_user(factory, email, role, invited_by):
    """새 사용자 초대 처리"""
    from factory.utils import send_invite_email, create_inviting_data

    # inviting 구조에 추가
    inviting = factory.inviting or []
    already_invited = any(item["email"] == email for item in inviting)

    if already_invited:
        raise HttpError(400, "이미 초대된 이메일입니다.")

    # 초대 정보 추가
    inviting.append(create_inviting_data(email, role, invited_by))
    factory.inviting = inviting
    factory.save()

    # 이메일 발송
    email_sent = send_invite_email(email, factory, role, invited_by)

    if email_sent:
        return {
            "message": "초대 메일을 발송했습니다.",
            "invited_user": {"email": email, "role": role},
        }
    else:
        # 이메일 발송 실패 시 inviting에서 제거
        factory.inviting = [item for item in factory.inviting if item["email"] != email]
        factory.save()
        raise HttpError(500, "초대 메일 발송에 실패했습니다.")


# Factory Member Tab
@router.get(
    "", summary="[C] 전체 멤버 및 초대 대기자 조회", response=List[FactoryMemberOut]
)
@paginate
async def list_factory_members(request):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)
    try:
        factory = await Factory.objects.prefetch_related("members__user").aget(
            id=int(factory_id)
        )
    except Factory.DoesNotExist:
        raise HttpError(404, "팩토리를 찾을 수 없습니다.")

    # 가입된 멤버
    members = factory.members.all()
    member_outs = []
    for idx, member in enumerate(members):
        member_out = {
            "id": 1000 + idx,  # 기존 멤버는 1000부터 시작
            "factory": member.factory_id,
            "user": member.user_id,
            "name": getattr(member.user, "username", "")
            or getattr(member.user, "name", "")
            or getattr(member.user, "email", ""),
            "email": getattr(member.user, "email", ""),
            "role": member.role,
            "status": member.status,
            "invited_at": member.invited_at.isoformat() if member.invited_at else None,
        }
        member_outs.append(member_out)

    # 미가입 초대자
    inviting = factory.inviting or []
    inviting_outs = []
    for idx, item in enumerate(inviting):
        inviting_outs.append(
            {
                "id": idx,  # 0, 1, 2, 3... (초대 대기자는 0부터)
                "factory": factory.id,
                "user": None,
                "name": "",
                "email": item.get("email", ""),
                "role": item.get("role", "invited"),
                "status": "invited",
                "invited_at": item.get("invited_at"),
            }
        )
    return member_outs + inviting_outs


@router.get(
    "/{member_id}",
    summary="[C] 멤버 상세 조회",
    description="멤버 상세 조회",
    response=Optional[FactoryMemberDetailOut],
)
async def get_factory_member(request, member_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    member = await is_factory_member(int(factory_id), user)
    return member


# Factory Member Tab
@router.patch("/{member_id}", summary="[C] 멤버 수정")
async def update_factory_member(
    request, member_id: int, payload: FactoryMemberUpdateIn
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    if member_id < 1000:  # 초대 대기자 (0~999)

        def _update_inviting():
            factory = Factory.objects.get(id=int(factory_id))
            inviting = factory.inviting or []
            if 0 <= member_id < len(inviting):
                inviting[member_id]["role"] = payload.role
                factory.inviting = inviting
                factory.save()
                return {
                    "id": member_id,
                    "factory": factory.id,
                    "user": None,
                    "role": inviting[member_id]["role"],
                }
            else:
                raise HttpError(404, "해당 초대 대기자를 찾을 수 없습니다.")

        return await sync_to_async(_update_inviting)()
    else:  # 기존 멤버 (1000+)
        # 1000+ ID를 실제 DB ID로 변환
        actual_member_id = member_id - 1000
        try:
            members = await sync_to_async(
                lambda: list(
                    FactoryMember.objects.select_related("user").filter(
                        factory_id=factory_id
                    )
                )
            )()
            if 0 <= actual_member_id < len(members):
                member = members[actual_member_id]
                if payload.role:
                    member.role = payload.role
                    await member.asave()
                    # 알림 전송
                    await send_notification(
                        user_id=member.user_id,
                        factory_id=member.factory_id,
                        notification_type="member_updated",
                        notification_case="permission_changed",
                        content=f"{member.user.username}님의 권한이 '{payload.role}'로 변경되었습니다.",
                    )
                return {
                    "id": member_id,  # 원래 요청된 ID 반환
                    "factory": member.factory_id,
                    "user": member.user_id,
                    "role": member.role,
                }
            else:
                raise HttpError(404, "해당 멤버를 찾을 수 없습니다.")
        except Exception as e:
            raise HttpError(404, "해당 멤버를 찾을 수 없습니다.")


# Factory Member Tab
@router.delete("/{member_id}", summary="[C] 멤버 삭제")
async def delete_factory_member(request, member_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    if member_id < 1000:  # 초대 대기자 (0~999)

        def _delete_inviting():
            factory = Factory.objects.get(id=int(factory_id))
            inviting = factory.inviting or []
            if 0 <= member_id < len(inviting):
                inviting.pop(member_id)
                factory.inviting = inviting
                factory.save()
                return {
                    "message": "초대 대기자가 삭제되었습니다.",
                    "deleted_member_id": member_id,
                }
            else:
                raise HttpError(404, "해당 초대 대기자를 찾을 수 없습니다.")

        return await sync_to_async(_delete_inviting)()
    else:  # 기존 멤버 (1000+)
        # 1000+ ID를 실제 DB ID로 변환
        actual_member_id = member_id - 1000
        try:
            members = await sync_to_async(
                lambda: list(FactoryMember.objects.filter(factory_id=factory_id))
            )()
            if 0 <= actual_member_id < len(members):
                member = members[actual_member_id]
                await sync_to_async(member.delete)()
                return {
                    "message": "멤버가 삭제되었습니다.",
                    "deleted_member_id": member_id,
                }
            else:
                raise HttpError(404, "해당 멤버를 찾을 수 없습니다.")
        except Exception as e:
            raise HttpError(404, "해당 멤버를 찾을 수 없습니다.")
