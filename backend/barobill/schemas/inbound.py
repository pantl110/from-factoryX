from ninja import Schema, Field
from pydantic import field_validator, ValidationInfo


class BarobillRegisterIn(Schema):
    factory: int = Field(..., description="공장 ID")


class BarobillCorpRegisterIn(Schema):
    factory: int = Field(..., description="공장 ID")
    grade: str = Field(..., description="회원 등급 (예: 대표자, 담당자)")
    barobill_id: str = Field(..., description="바로빌 ID")
    barobill_password: str = Field(..., description="바로빌 비밀번호")
    barobill_password_confirm: str = Field(..., description="바로빌 비밀번호 확인")

    @field_validator("barobill_password_confirm")
    @classmethod
    def validate_passwords_match(cls, v: str, info: ValidationInfo) -> str:
        if "barobill_password" in info.data and v != info.data["barobill_password"]:
            raise ValueError("비밀번호가 일치하지 않습니다")
        return v


class BarobillCorpCertIn(Schema):
    factory: int = Field(..., description="공장 ID")
    barobill_id: str = Field(..., description="바로빌 ID")
    barobill_password: str = Field(..., description="바로빌 비밀번호")
