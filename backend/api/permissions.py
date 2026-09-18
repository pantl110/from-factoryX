from asgiref.sync import sync_to_async
from ninja.errors import HttpError

from apikey.models import ApiKey
from factory.models import FactoryMember

async def get_factory_roles(user):
    memberships = await sync_to_async(list)(
        FactoryMember.objects.filter(user=user, status="active").values("factory_id", "role")
    )
    return [
        {"factory_id": m["factory_id"], "role": m["role"]}
        for m in memberships
    ]

async def has_manager_role(user):
    roles = await get_factory_roles(user)
    return any(r["role"] == "manager" for r in roles)

async def has_admin_role(user):
    roles = await get_factory_roles(user)
    return any(r["role"] in ["admin", "manager"] for r in roles)


async def require_factory_access(factory_id: int, principal):
    factory_id = int(factory_id)

    if isinstance(principal, ApiKey):
        if principal.factory_id != factory_id:
            raise HttpError(403, "API Key에 허용되지 않은 공장입니다.")
        return principal

    try:
        return await FactoryMember.objects.aget(
            factory_id=factory_id,
            user=principal,
        )
    except FactoryMember.DoesNotExist:
        raise HttpError(404, "해당 공장의 멤버가 아닙니다.") 