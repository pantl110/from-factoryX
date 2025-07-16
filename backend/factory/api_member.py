from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from factory.models import Factory, FactoryMember
from user.models import User
from factory.schemas import FactoryMemberOut, FactoryMemberUpdateIn
from typing import List
from django.db import transaction
from ninja import Schema
from ninja.pagination import paginate

class InviteMemberIn(Schema):
    factory_id: int
    email: str
    role: str

router = Router(tags=["FactoryMember"])

def send_invite_email(email, factory, role):
    print(f"[더미] {email}에게 {factory.name}({role}) 초대 메일 발송")

def get_user_id(user):
    try:
        return int(getattr(user, 'id', getattr(user, 'pk', 0)))
    except Exception:
        return 0

@router.post(
    "/invite",
    summary="[C] 팩토리 멤버 초대"
)
async def invite_factory_member(request, payload: InviteMemberIn):
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


@router.get(
    "",
    summary="[C] 전체 멤버 조회",
    response=List[FactoryMemberOut]
)
@paginate
async def list_factory_members(request, factory_id: int):
    members = await sync_to_async(lambda: list(FactoryMember.objects.filter(factory_id=factory_id).select_related("user", "invited_by")))()
    return members


@router.get(
    "/invited",
    summary="[C] 내가 초대한(미가입) 멤버 조회"
)
async def list_inviting_members(request, factory_id: int):
    factory = await sync_to_async(Factory.objects.get)(id=factory_id)
    user_id = get_user_id(request.user)
    inviting = [item for item in (factory.inviting or []) if item.get("invited_by") == user_id]
    return {"inviting": inviting}


@router.delete(
    "/{member_id}",
    summary="[C] 멤버 삭제"
)
async def delete_factory_member(request, member_id: int):
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
