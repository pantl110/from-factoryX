from ninja import Schema
from user.models import User


class UserSignupIn(Schema):
    username: str
    email: str
    password: str
    password_confirm: str
    terms_of_service: bool
    privacy_policy_agreement: bool


class EmailVerificationRequestIn(Schema):
    email: str
    verification_type: str  # "회원가입" or "비밀번호재설정"


class EmailVerificationCodeIn(Schema):
    email: str
    code: str
    verification_type: str


class PasswordResetIn(Schema):
    email: str
    code: str
    new_password: str
    new_password_confirm: str


class UserUpdateIn(Schema):
    real_name: str
    phone: str
    memo: str


class UserLoginIn(Schema):
    email: str
    password: str


class RefreshTokenIn(Schema):
    refresh_token: str
