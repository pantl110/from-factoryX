from ninja import Schema, Field, FilterSchema
from typing import Optional
from datetime import date

class QuotationCreateIn(Schema):
    factory: int
    client: int
    project: int
    due_date: date

class QuotationFilter(FilterSchema):
    client_id: Optional[int] = Field(None, q="client_id")
    project_id: Optional[int] = Field(None, q="project_id")
    due_date: Optional[date] = Field(None, q="due_date")

class QuotationDetailIn(Schema):
    quotation_id: int
    factory_id: int

class QuotationUpdateIn(Schema):
    quotation_id: int
    factory_id: int
    due_date: Optional[date] = None

class QuotationDeleteIn(Schema):
    quotation_id: int

class QuotationSendEmailIn(Schema):
    recipient_email: str
    subject: str
    body: str

class TaxInvoiceCreateIn(Schema):
    issue_type: str = Field(..., description="발행 유형")

class QuotationProductCreateIn(Schema):
    quotation: int
    product: int
    quantity: int
    unit_price: int

class QuotationProductListIn(Schema):
    quotation_id: Optional[int]
    product_id: Optional[int]
    is_delivery: Optional[bool]

class QuotationProductDetailIn(Schema):
    id: int

class QuotationProductUpdateIn(Schema):
    quotation_product_id: int
    factory_id: int
    quantity: Optional[int]
    unit_price: Optional[int]

class QuotationProductDeliveryUpdateIn(Schema):
    is_delivery: bool
    delivery_date: date

class QuotationProductDeleteIn(Schema):
    quotation_product_id: int

class QuotationProductFilter(FilterSchema):
    quotation_id: Optional[int] = Field(None, q="quotation_id")
    product_id: Optional[int] = Field(None, q="product_id")
    is_delivery: Optional[bool] = Field(None, q="is_delivery")
