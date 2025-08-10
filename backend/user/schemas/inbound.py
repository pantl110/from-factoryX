from ninja import Schema, Field, ModelSchema
from user.models import User
from typing import Optional


class UserSignupIn(Schema):
    email: str
    password: str
    password_confirm: str
    terms_of_service: bool
    privacy_policy_agreement: bool
    marketing_agreement: bool = Field(
        default=False, description="마케팅 정보 수신 동의 여부"
    )
    factory_id: Optional[int] = Field(
        None, description="팩토리 ID (초대받은 경우)"
    )
    invite_role: Optional[str] = Field(
        None, description="초대받은 역할 (초대받은 경우)"
    )


class UserLoginIn(Schema):
    email: str
    password: str


class RefreshTokenIn(Schema):
    refresh_token: str


class EmailVerificationRequestIn(Schema):
    email: str
    verification_type: str


class EmailVerificationCodeIn(Schema):
    email: str
    code: str
    verification_type: str


class UserUpdateIn(Schema):
    username: Optional[str] = Field(None, description="사용자명")
    phone_number: Optional[str] = Field(None, description="전화번호")
    profile_image: Optional[str] = Field(None, description="프로필 이미지")
    marketing_agreement: Optional[bool] = Field(
        None, description="마케팅 정보 수신 동의 여부"
    )


class PasswordResetIn(Schema):
    email: str
    code: str
    new_password: str
    new_password_confirm: str
