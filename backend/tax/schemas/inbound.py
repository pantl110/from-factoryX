from ninja import Schema, ModelSchema, Field, FilterSchema
from tax.models import NationalTaxService, PublishStatus
from typing import List, Optional
from datetime import date
from pydantic import field_validator


class TaxServiceItem(Schema):
    id: Optional[int] = Field(None, description="품목 식별자(순번)")
    purchase_expiry: Optional[date | str] = Field(None, description="공급일자")
    product_id: Optional[int] = Field(None, description="품목 ID")
    name: Optional[str] = Field(None, description="품목")
    code: Optional[str] = Field(None, description="품목 코드")
    information: Optional[str] = Field("", description="규격")
    chargeable_unit: Optional[str] = Field(None, description="수량")
    unit_price: Optional[str] = Field(None, description="단가")
    amount: Optional[str] = Field(None, description="공급가액")
    tax: Optional[str] = Field(None, description="세액")
    description: Optional[str] = Field("", description="비고")
    material_history: Optional[str | int] = Field(
        None, description="자재이력 (매입 세금계산서에서 활용)"
    )

    @field_validator("purchase_expiry")
    @classmethod
    def convert_date_to_string(cls, v):
        if v is None:
            return v
        if isinstance(v, date):
            return v.strftime("%Y%m%d")
        if isinstance(v, str):
            return v.replace("-", "")
        return v


class NationalTaxServiceCreateIn(ModelSchema):
    tax_id: Optional[int] = Field(None, description="세금계산서 ID (수정 시에만 사용)")
    factory: int = Field(..., description="공장 ID")
    client: Optional[int] = Field(None, description="거래처 ID")
    line_items: Optional[List[TaxServiceItem]] = Field(
        default=[],
        description="세금계산서 품목 리스트",
    )
    publish_status: Optional[str] = Field(
        PublishStatus.temporary, description="발행 상태"
    )

    class Meta:
        model = NationalTaxService
        exclude = [
            "id",
            "user",
            "factory",
            "factory_info",
            "client",
            "client_info",
            "publish_status",
            "mgt_key",
            "nts_send_key",
            "barobill_state",
            "nts_send_state",
            "created_at",
            "updated_at",
        ]


class NationalTaxServiceUpdateIn(ModelSchema):
    factory: Optional[int] = Field(None, description="공장 ID")
    client: Optional[int] = Field(None, description="거래처 ID")
    line_items: Optional[List[TaxServiceItem]] = Field(
        None,
        description="세금계산서 품목 리스트",
    )
    transaction_date: Optional[date] = Field(
        None, description="거래일자 (YYYY-MM-DD 형식)", example="2023-10-01"
    )
    is_hidden: Optional[bool] = Field(None, description="숨김 여부")

    class Meta:
        model = NationalTaxService
        exclude = [
            "id",
            "user",
            "created_at",
            "updated_at",
        ]


class LinkTaxInvoiceIn(Schema):
    project_id: int
    tax_id: int  # 배열에서 단일 값으로 변경


class TaxInvoiceFilter(FilterSchema):
    q: Optional[str] = Field(
        None,
        q=["client__name__icontains"],
        description="거래처명 또는 품목명 통합 검색어",
        expression_connector="OR",
    )
    tax_invoice_type: Optional[str] = Field(
        None, q="tax_invoice_type", description="sales-매출, purchase-매입"
    )
    start_date: Optional[date] = Field(
        None, q="transaction_date__gte", description="발급일자 범위 시작일"
    )
    end_date: Optional[date] = Field(
        None, q="transaction_date__lte", description="발급일자 범위 종료일"
    )
    is_hidden: Optional[bool] = Field(None, q="is_hidden", description="숨김 여부")
    publish_status: Optional[str] = Field(
        None, q="publish_status", description="발행 상태"
    )


class CashToMaterialHistoryIn(Schema):
    material_history_id: List[int]


class TaxToMaterialHistoryIn(Schema):
    line_item_id: int
    material_history_id: int


class TaxInvoiceAccountUpdateIn(Schema):
    """매출 채권/채무 정보 수정 스키마"""
    project_id: Optional[int] = Field(None, description="프로젝트 ID")
    status: Optional[str] = Field(None, description="채권/채무 상태 (waiting, overdue, partial, completed)")
    invoice_sent_count: Optional[int] = Field(None, description="청구서 발송 횟수")
    total_billed_amount: Optional[int] = Field(None, description="청구금액(합계)")
    outstanding_balance: Optional[int] = Field(None, description="미수금액(잔액)")
    collection_terms: Optional[str] = Field(None, description="수금 조건")
    collection_terms_custom: Optional[str] = Field(None, description="수금 조건 직접 입력")
    agreed_payment_date: Optional[date] = Field(None, description="약정 입금일")
    notes: Optional[str] = Field(None, description="특이사항")
