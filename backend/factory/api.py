from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth, jwt_manager_auth, jwt_admin_auth
from factory.schemas.inbound import FactoryUpdateIn
from factory.schemas.outbound import FactoryOut
from factory.models import Factory, FactoryMember
from typing import List
from ninja.errors import HttpError
from factory.utils import is_factory_member
from asgiref.sync import sync_to_async


router = Router(tags=["Factory"])


# Onboarding Tab
@router.post(
    "",
    summary="[C] 공장 등록",
    description="공장을 등록하고 권한을 관리자로 설정합니다.",
    response={201: dict},
    auth=jwt_auth,
)
async def create_factory(request):
    user = request.auth
    factory = await Factory.objects.acreate(owner=user)

    await FactoryMember.objects.acreate(
        factory=factory,
        user=user,
        role=FactoryMember.FactoryMemberType.admin,
        status=FactoryMember.MemberStatus.active,
        invited_by=user,
    )
    return 201, {"factory_id": factory.id}


@router.get(
    "",
    summary="[C] 본인의 공장 목록 조회",
    description="사용자가 멤버로 등록된 공장 목록을 조회합니다.",
    response={200: List[FactoryOut]},
    auth=jwt_auth,
)
@paginate
async def list_factories(request):
    user = request.auth

    @sync_to_async
    def get_factories():
        # FactoryMember 정보를 함께 조회하여 invited_at 포함
        member_factories = FactoryMember.objects.filter(
            user=user, 
            status=FactoryMember.MemberStatus.active
        ).select_related('factory').order_by('-invited_at')
        
        return list(member_factories)

    member_factories = await get_factories()
    
    # 모델 객체를 딕셔너리로 변환
    factory_list = []
    for member in member_factories:
        factory = member.factory
        factory_list.append({
            "id": factory.id,
            "owner": factory.owner_id,
            "name": factory.name,
            "business_registration_number": factory.business_registration_number,
            "representative_name": factory.representative_name,
            "manager_email": factory.manager_email,
            "manager_phone": factory.manager_phone,
            "manager_fax": factory.manager_fax,
            "business_type": factory.business_type,
            "business_category": factory.business_category,
            "business_address": factory.business_address,
            "is_trial": factory.is_trial,
            "billing_key": factory.billing_key,
            "inviting": factory.inviting,
            "created_at": factory.created_at.isoformat() if factory.created_at else None,
            "updated_at": factory.updated_at.isoformat() if factory.updated_at else None,
            "invited_at": member.invited_at.isoformat() if member.invited_at else None,
            "role": member.role,
            "invited_by": member.invited_by_id,
        })
    
    return factory_list


@router.get(
    "/detail",
    summary="[C] 공장 상세 조회",
    description="공장 ID로 공장 정보를 조회합니다.",
    response={200: FactoryOut},
    auth=jwt_auth,
)
async def get_factory(request):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory = await Factory.objects.aget(id=int(factory_id))
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않습니다.")
    
    # FactoryMember 정보 조회
    @sync_to_async
    def get_factory_member():
        return FactoryMember.objects.filter(
            factory=factory, 
            user=user,
            status=FactoryMember.MemberStatus.active
        ).first()
    
    member = await get_factory_member()
    
    return {
        "id": factory.id,
        "owner": factory.owner_id,
        "name": factory.name,
        "business_registration_number": factory.business_registration_number,
        "representative_name": factory.representative_name,
        "manager_email": factory.manager_email,
        "manager_phone": factory.manager_phone,
        "manager_fax": factory.manager_fax,
        "business_type": factory.business_type,
        "business_category": factory.business_category,
        "business_address": factory.business_address,
        "is_trial": factory.is_trial,
        "billing_key": factory.billing_key,
        "inviting": factory.inviting,
        "created_at": factory.created_at.isoformat() if factory.created_at else None,
        "updated_at": factory.updated_at.isoformat() if factory.updated_at else None,
        "invited_at": member.invited_at.isoformat() if member and member.invited_at else None,
        "role": member.role if member else None,
        "invited_by": member.invited_by_id if member else None,
    }


@router.patch(
    "",
    summary="[C] 공장 정보 수정",
    description="공장 ID로 공장 정보를 수정합니다.",
    response={200: FactoryOut},
    auth=jwt_auth,
)
async def update_factory(request, payload: FactoryUpdateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory = await Factory.objects.aget(id=int(factory_id))
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않습니다.")

    # None이 아닌 값만 업데이트
    update_data = payload.dict(exclude_unset=True)
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    for field, value in update_data.items():
        setattr(factory, field, value)
    
    await factory.asave()
    
    # FactoryMember 정보 조회
    @sync_to_async
    def get_factory_member():
        return FactoryMember.objects.filter(
            factory=factory, 
            user=user,
            status=FactoryMember.MemberStatus.active
        ).first()
    
    member = await get_factory_member()
    
    return {
        "id": factory.id,
        "owner": factory.owner_id,
        "name": factory.name,
        "business_registration_number": factory.business_registration_number,
        "representative_name": factory.representative_name,
        "manager_email": factory.manager_email,
        "manager_phone": factory.manager_phone,
        "manager_fax": factory.manager_fax,
        "business_type": factory.business_type,
        "business_category": factory.business_category,
        "business_address": factory.business_address,
        "is_trial": factory.is_trial,
        "billing_key": factory.billing_key,
        "inviting": factory.inviting,
        "created_at": factory.created_at.isoformat() if factory.created_at else None,
        "updated_at": factory.updated_at.isoformat() if factory.updated_at else None,
        "invited_at": member.invited_at.isoformat() if member and member.invited_at else None,
        "role": member.role if member else None,
        "invited_by": member.invited_by_id if member else None,
    }


@router.delete(
    "",
    summary="[C] 공장 삭제",
    description="공장 ID로 공장을 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_factory(request):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    try:
        factory = await Factory.objects.aget(id=int(factory_id))
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않습니다.")
    
    await factory.adelete()
    return 204, None
