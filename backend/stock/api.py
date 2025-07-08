from ninja import Router
from api.security import jwt_auth

router = Router(tags=["Stock"], auth=jwt_auth)
