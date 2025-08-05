from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from factory.models import Factory, FactoryMember
from user.models import User
from api.security import jwt_auth
from typing import List
from ninja.pagination import paginate
from factory.schemas.inbound import InviteMemberIn, FactoryMemberUpdateIn
from factory.schemas.outbound import FactoryMemberOut
from datetime import datetime, timezone
from factory.utils import is_factory_member


router = Router(tags=["FactoryMember"], auth=jwt_auth)


# Factory Member Tab
@router.post(
    "/invite",
    summary="[C] 팩토리 멤버 초대"
)
async def invite_factory_member(request, payload: InviteMemberIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    def send_invite_email(email, factory, role):
        print(f"[더미] {email}에게 {factory.name}({role}) 초대 메일 발송")

    def get_user_id(user):
        try:
            return int(getattr(user, 'id', getattr(user, 'pk', 0)))
        except Exception:
            return 0

    def _invite_member():
        factory = Factory.objects.get(id=int(factory_id))
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
async def list_factory_members(request):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    factory = await sync_to_async(Factory.objects.get)(id=int(factory_id))
    # 가입된 멤버
    members = await sync_to_async(lambda: list(FactoryMember.objects.filter(factory_id=int(factory_id)).select_related("user")))()
    member_outs = []
    for idx, member in enumerate(members):
        member_out = {
            "id": 1000 + idx,  # 기존 멤버는 1000부터 시작
            "factory": member.factory_id,
            "user": member.user_id,
            "name": getattr(member.user, 'username', '') or getattr(member.user, 'name', '') or getattr(member.user, 'email', ''),
            "email": getattr(member.user, 'email', ''),
            "role": member.role,
            "status": member.status,
            "invited_at": member.invited_at.isoformat() if member.invited_at else None,
        }
        member_outs.append(member_out)
    
    # 미가입 초대자
    inviting = factory.inviting or []
    inviting_outs = []
    for idx, item in enumerate(inviting):
        inviting_outs.append({
            "id": idx,  # 0, 1, 2, 3... (초대 대기자는 0부터)
            "factory": factory.id,
            "user": None,
            "name": "",
            "email": item.get("email", ""),
            "role": item.get("role", "invited"),
            "status": "invited",
            "invited_at": item.get("invited_at"),
        })
    return member_outs + inviting_outs


# Factory Member Tab
@router.patch(
    "/{member_id}",
    summary="[C] 멤버 수정"
)
async def update_factory_member(request, member_id: int, payload: FactoryMemberUpdateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    if member_id < 1000:  # 초대 대기자 (0~999)
        def _update_inviting():
            factory = Factory.objects.get(id=int(factory_id))
            inviting = factory.inviting or []
            if 0 <= member_id < len(inviting):
                inviting[member_id]['role'] = payload.role
                factory.inviting = inviting
                factory.save()
                return {
                    "id": member_id,
                    "factory": factory.id,
                    "user": None,
                    "role": inviting[member_id]['role'],
                }
            else:
                raise HttpError(404, "해당 초대 대기자를 찾을 수 없습니다.")
        return await sync_to_async(_update_inviting)()
    else:  # 기존 멤버 (1000+)
        # 1000+ ID를 실제 DB ID로 변환
        actual_member_id = member_id - 1000
        try:
            members = await sync_to_async(lambda: list(FactoryMember.objects.filter(factory_id=factory_id)))()
            if 0 <= actual_member_id < len(members):
                member = members[actual_member_id]
                if payload.role:
                    member.role = payload.role
                    await sync_to_async(member.save)()
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
@router.delete(
    "/{member_id}",
    summary="[C] 멤버 삭제"
)
async def delete_factory_member(request, member_id: int):
    factory_id = request.GET.get('factory_id')
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
                return {"message": "초대 대기자가 삭제되었습니다.", "deleted_member_id": member_id}
            else:
                raise HttpError(404, "해당 초대 대기자를 찾을 수 없습니다.")
        return await sync_to_async(_delete_inviting)()
    else:  # 기존 멤버 (1000+)
        # 1000+ ID를 실제 DB ID로 변환
        actual_member_id = member_id - 1000
        try:
            members = await sync_to_async(lambda: list(FactoryMember.objects.filter(factory_id=factory_id)))()
            if 0 <= actual_member_id < len(members):
                member = members[actual_member_id]
                await sync_to_async(member.delete)()
                return {"message": "멤버가 삭제되었습니다.", "deleted_member_id": member_id}
            else:
                raise HttpError(404, "해당 멤버를 찾을 수 없습니다.")
        except Exception as e:
            raise HttpError(404, "해당 멤버를 찾을 수 없습니다.")
