from ninja.errors import HttpError
from factory.models import Factory, FactoryEquipment
from factory.models import Factory, FactoryClient, FactoryMember


async def is_factory_member(factory_id: int, user=None):
    """공장 ID와 사용자로 공장 멤버 여부를 확인합니다."""
    try:
        member = await FactoryMember.objects.aget(factory_id=factory_id, user=user)
        return member
    except FactoryMember.DoesNotExist:
        raise HttpError(404, "해당 공장에 멤버가 아닙니다.")


async def require_factory_admin(factory_id: int, user=None):
    """공장 관리자 권한이 필요합니다."""
    try:
        member = await FactoryMember.objects.aget(factory_id=factory_id, user=user)
        if member.role != 'admin':
            raise HttpError(403, "관리자 권한이 필요합니다.")
        return member
    except FactoryMember.DoesNotExist:
        raise HttpError(404, "해당 공장에 멤버가 아닙니다.")


async def require_factory_manager(factory_id: int, user=None):
    """공장 매니저 이상 권한이 필요합니다."""
    try:
        member = await FactoryMember.objects.aget(factory_id=factory_id, user=user)
        if member.role not in ['admin', 'manager']:
            raise HttpError(403, "매니저 이상 권한이 필요합니다.")
        return member
    except FactoryMember.DoesNotExist:
        raise HttpError(404, "해당 공장에 멤버가 아닙니다.")


async def require_factory_viewer(factory_id: int, user=None):
    """공장 조회자 이상 권한이 필요합니다."""
    try:
        member = await FactoryMember.objects.aget(factory_id=factory_id, user=user)
        if member.role not in ['admin', 'manager', 'viewer']:
            raise HttpError(403, "조회자 이상 권한이 필요합니다.")
        return member
    except FactoryMember.DoesNotExist:
        raise HttpError(404, "해당 공장에 멤버가 아닙니다.")


def get_factory_permission_level(role: str) -> int:
    """권한 레벨을 숫자로 반환합니다."""
    permission_levels = {
        'viewer': 1,
        'manager': 2,
        'admin': 3
    }
    return permission_levels.get(role, 0)


async def has_factory_permission(factory_id: int, user=None, required_role: str = 'viewer') -> bool:
    """사용자가 해당 공장에서 필요한 권한을 가지고 있는지 확인합니다."""
    try:
        member = await FactoryMember.objects.aget(factory_id=factory_id, user=user)
        user_level = get_factory_permission_level(member.role)
        required_level = get_factory_permission_level(required_role)
        return user_level >= required_level
    except FactoryMember.DoesNotExist:
        return False


async def get_factory_by_id(factory_id: int, user=None):
    """공장 ID로 공장을 조회하고 소유권을 검증합니다."""
    try:
        if user is None:
            factory = await Factory.objects.aget(id=factory_id)
        else:
            factory = await Factory.objects.aget(id=factory_id, owner=user)
        return factory
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않습니다.")


async def verify_factory_ownership(factory_id: int, user=None):
    """공장 소유권을 검증합니다."""
    try:
        await Factory.objects.aget(id=factory_id, owner=user)
        return True
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않거나 접근 권한이 없습니다.")


async def get_factory_eq_by_id(equipment_id: int, user=None):
    try:
        # Get equipment and ensure it belongs to a factory owned by the user
        equipment = await FactoryEquipment.objects.select_related("factory").aget(
            id=equipment_id, factory__owner=user
        )
        return equipment
    except FactoryEquipment.DoesNotExist:
        raise HttpError(404, "해당 설비가 존재하지 않습니다.")


# 거래처 관련 유틸리티 함수
async def get_factory_client_by_id(client_id: int, factory_id: int, user=None):
    """거래처 ID로 거래처를 조회하고 공장 소유권을 검증합니다."""
    try:
        if user is None:
            client = await FactoryClient.objects.aget(
                id=client_id, factory_id=factory_id
            )
        else:
            client = await FactoryClient.objects.aget(
                id=client_id, factory_id=factory_id, factory__owner=user
            )
        return client
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "해당 거래처가 존재하지 않습니다.")


# 거래처 관련 유틸리티 함수
async def get_factory_clients_by_factory(factory_id: int, user=None):
    """공장의 모든 거래처를 조회합니다."""
    # 공장 소유권 검증
    await verify_factory_ownership(factory_id, user)

    clients = FactoryClient.objects.filter(
        factory_id=factory_id, factory__owner=user
    ).order_by("-created_at")
    return clients


async def search_factory_clients_by_factory(
    factory_id: int, user=None, search_query: str = ""
):
    """공장의 거래처를 검색합니다."""
    # 공장 소유권 검증
    await verify_factory_ownership(factory_id, user)

    from factory.schemas.inbound import FactoryClientFilter

    # FilterSchema를 사용하여 검색
    filter_schema = FactoryClientFilter()
    if search_query:
        # 검색어가 있으면 name, business_registration_number, representative_name에 대해 검색
        filter_schema.name = search_query
        filter_schema.business_registration_number = search_query
        filter_schema.representative_name = search_query

    queryset = FactoryClient.objects.filter(factory_id=factory_id, factory__owner=user)
    queryset = filter_schema.filter(queryset)

    return queryset.order_by("-created_at")
