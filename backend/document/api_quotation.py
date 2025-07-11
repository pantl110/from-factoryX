from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth

router = Router(tags=["Quotation"], auth=jwt_auth)