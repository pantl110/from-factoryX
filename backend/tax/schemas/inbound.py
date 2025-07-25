from ninja import Schema, ModelSchema, Field
from tax.models import NationalTaxService
from typing import List, Optional
from datetime import date
from pydantic import field_validator


class TaxServiceItem(Schema):
    purchase_expiry: date = Field(..., description="공급일자")
    name: str = Field(..., description="품목")
    information: Optional[str] = Field("", description="규격")
    chargeable_unit: str = Field(..., description="수량")
    unit_price: str = Field(..., description="단가")
    amount: str = Field(..., description="공급가액")
    tax: str = Field(..., description="세액")
    description: Optional[str] = Field("", description="비고")

    @field_validator("purchase_expiry")
    @classmethod
    def convert_date_to_string(cls, v):
        print("🐍 File: schemas/inbound.py | Line: 21 | TaxServiceItem ~ v", v)
        print(v)
        if isinstance(v, date):
            return v.strftime("%Y%m%d")
        return v


class NationalTaxServiceCreateIn(ModelSchema):
    factory: int = Field(..., description="공장 ID")
    client: int = Field(..., description="거래처 ID")
    product: List[Optional[int]] = Field(default=[], description="품목 ID 리스트")
    line_items: List[TaxServiceItem] = Field(
        ...,
        description="세금계산서 품목 리스트",
    )

    class Meta:
        model = NationalTaxService
        exclude = [
            "id",
            "user",
            "factory",
            "client",
            "product",
            "created_at",
            "updated_at",
        ]


class LinkTaxInvoiceIn(Schema):
    project_id: int
    tax_id: int  # 배열에서 단일 값으로 변경
