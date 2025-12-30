from ninja import Schema, ModelSchema, Field
from user.models import User
from typing import Optional


class UserMeOut(ModelSchema):
    # email: Optional[str] = Field(None, description="이메일")
    # status: Optional[str] = Field(None, description="상태")
    # username: Optional[str] = Field(None, description="사용자 이름")
    # phone_number: Optional[str] = Field(None, description="전화번호")
    # profile_image: Optional[str] = Field(None, description="프로필 이미지")
    role: Optional[str] = Field(None, description="공장 멤버 권한 (해당 공장 기준)")

    class Meta:
        model = User
        fields = [
            "email",
            "status",
            "username",
            "phone_number",
            "profile_image",
            "language",
        ]
        fields_optional = [
            "email",
            "status",
            "username",
            "phone_number",
            "profile_image",
            "language",
        ]


# class UserMeWithMemberOut(Schema):
#     email: str
#     status: str
#     username: Optional[str] = None
#     phone_number: Optional[str] = None
#     profile_image: Optional[str] = None
#     member_id: Optional[int] = None
class UserMeWithMemberOut(ModelSchema):
    member_id: Optional[int] = Field(None, description="멤버 ID")
    phone_number: Optional[str] = Field(None, description="전화번호")
    profile_image: Optional[str] = Field(None, description="프로필 이미지")
    barobill_user_id: Optional[str] = Field(None, description="바로빌 사용자 ID")

    class Meta:
        model = User
        fields = [
            "email",
            "status",
            "username",
            "language",
        ]


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
