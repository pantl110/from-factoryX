from ninja import Schema, Field, ModelSchema
from user.models import User


class UserSignupIn(Schema):
    email: str
    password: str
    password_confirm: str
    terms_of_service: bool
    privacy_policy_agreement: bool
    marketing_agreement: bool = Field(
        default=False, description="마케팅 정보 수신 동의 여부"
    )


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


class UserUpdateIn(ModelSchema):
    class Meta:
        model = User
        fields = [
            "phone_number",
            "profile_image",
            "marketing_agreement",
        ]


class UserLoginIn(Schema):
    email: str
    password: str


class RefreshTokenIn(Schema):
    refresh_token: str
