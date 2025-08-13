from asgiref.sync import sync_to_async
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