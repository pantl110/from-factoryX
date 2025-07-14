from ninja import Schema, ModelSchema
from user.models import User


class UserMeOut(Schema):
    email: str
    status: str
    username: str
    phone_number: str


class UserLoginOut(Schema):
    access_token: str
    refresh_token: str
    status: str


class UserRefreshTokenOut(Schema):
    access_token: str
    refresh_token: str


class SuccessOut(Schema):
    detail: str


class EmailVerificationOut(Schema):
    detail: str
    expires_at: str


class EmailVerificationCodeOut(Schema):
    detail: str
    is_verified: bool
