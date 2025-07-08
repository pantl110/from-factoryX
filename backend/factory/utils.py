from ninja.errors import HttpError
from factory.models import Factory, FactoryEquipment
from factory.models import Factory, FactoryClient
from django.db.models import Q


async def get_factory_by_id(factory_id: int, user=None):
    try:
        factory = await Factory.objects.aget(id=factory_id, owner=user)
        return factory
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않습니다.")


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
    try:
        client = await FactoryClient.objects.aget(
            id=client_id, factory_id=factory_id, factory__owner=user
        )
        return client
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "해당 거래처가 존재하지 않습니다.")


# 거래처 관련 유틸리티 함수
async def get_factory_clients_by_factory(factory_id: int, user=None):
    """공장의 모든 거래처를 조회합니다."""
    clients = FactoryClient.objects.filter(
        factory_id=factory_id, factory__owner=user
    ).order_by("-created_at")
    return clients


async def search_factory_clients_by_factory(
    factory_id: int, user=None, search_query: str = ""
):
    """공장의 거래처를 검색합니다."""
    clients = (
        FactoryClient.objects.filter(factory_id=factory_id, factory__owner=user)
        .filter(
            Q(name__icontains=search_query)
            | Q(business_registration_number__icontains=search_query)
            | Q(representative_name__icontains=search_query)
        )
        .order_by("-created_at")
    )
    return clients
