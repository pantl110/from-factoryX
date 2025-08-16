from ninja import Schema, ModelSchema
from user.models import User
from typing import Optional


class UserMeOut(Schema):
    email: str
    status: str
    username: Optional[str] = None
    phone_number: Optional[str] = None
    profile_image: Optional[str] = None


class UserMeWithMemberOut(Schema):
    email: str
    status: str
    username: Optional[str] = None
    phone_number: Optional[str] = None
    profile_image: Optional[str] = None
    member_id: Optional[int] = None


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
