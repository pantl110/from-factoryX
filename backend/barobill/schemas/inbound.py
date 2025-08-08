from ninja import Schema, Field
from pydantic import field_validator, ValidationInfo
from datetime import date
from django.utils import timezone
from datetime import timedelta


class BarobillCorpRegisterIn(Schema):
    factory: str = Field(..., description="공장 ID")
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
    factory: str = Field(..., description="공장 ID")
    barobill_id: str = Field(..., description="바로빌 ID")
    barobill_password: str = Field(..., description="바로빌 비밀번호")


class BarobillGetPeriodIn(Schema):
    factory: str = Field(..., description="공장 ID")
    start_date: date = Field(
        default=timezone.now() - timedelta(days=30), description="조회 시작 날짜"
    )
    end_date: date = Field(default=timezone.now(), description="조회 종료 날짜")
    page_size: int = Field(default=10, ge=1, le=100, description="페이지당 항목 수")
    page: int = Field(default=1, ge=1, description="페이지 번호")


class BarobillTaxInvoiceIssueIn(Schema):
    factory: str = Field(..., description="공장 ID")
    purpose_type: int = Field(
        default=1,
        ge=1,
        le=2,
        description="발행 목적 (1: 영수, 2: 청구)",
    )
    write_date: date = Field(
        default=timezone.now().date(),
        description="작성 날짜 (기본값: 오늘)",
    )
    amount_total: float = Field(
        default=0.0,
        description="총 금액",
    )
    tax_total: float = Field(
        default=0.0,
        description="세금",
    )


class BarobillCashBillIssueIn(Schema):
    factory: str = Field(..., description="공장 ID")
    identity_num: str = Field(..., description="발행자 번호")
    trade_date: date = Field(..., description="거래 날짜")
    trade_method: str = Field(
        default="5",
        description="거래 방법 (4: 사업자번호, 5: 휴대폰번호)",
    )
    item_name: str = Field(
        default="",
        description="거래 품목 이름",
    )
    amount: float = Field(
        ...,
        ge=0,
        description="거래 금액",
    )
    tax: float = Field(
        ...,
        ge=0,
        description="거래 세금",
    )
