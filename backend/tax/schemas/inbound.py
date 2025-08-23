from ninja import Schema, ModelSchema, Field, FilterSchema
from tax.models import NationalTaxService
from typing import List, Optional
from datetime import date
from pydantic import field_validator


class TaxServiceItem(Schema):
    purchase_expiry: Optional[date | str] = Field(None, description="공급일자")
    name: Optional[str] = Field(None, description="품목")
    information: Optional[str] = Field("", description="규격")
    chargeable_unit: Optional[str] = Field(None, description="수량")
    unit_price: Optional[str] = Field(None, description="단가")
    amount: Optional[str] = Field(None, description="공급가액")
    tax: Optional[str] = Field(None, description="세액")
    description: Optional[str] = Field("", description="비고")

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
    product: List[Optional[int]] = Field(default=[], description="품목 ID 리스트")
    line_items: Optional[List[TaxServiceItem]] = Field(
        default=[],
        description="세금계산서 품목 리스트",
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
            "product",
            "products_info",
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
    product: List[Optional[int]] = Field(default=None, description="품목 ID 리스트")
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
        q=["client__name__icontains", "product__name__icontains"],
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
