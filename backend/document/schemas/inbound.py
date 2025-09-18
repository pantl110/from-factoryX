from ninja import Schema, Field, FilterSchema, ModelSchema
from typing import List, Optional
from document.models import WorkInstruction


# Factory Client Field
class FactoryClientInfoIn(Schema):
    client_id: Optional[int] = None  # 기존 클라이언트 ID (선택사항)
    # type: str = "customer"
    is_customer: Optional[bool] = None
    is_supplier: Optional[bool] = None
    name: str
    business_registration_number: Optional[str] = None
    representative_name: Optional[str] = None
    business_type: Optional[str] = None
    business_category: Optional[str] = None
    address: Optional[str] = None
    manager: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None


# Quotation Product Field (확정용)
class QuotationProductInfoIn(Schema):
    product_id: int
    quantity: int
    unit_price: int
    is_delivery: bool = False
    delivery_date: Optional[str] = None


# Quotation Product Field (임시저장용)
class QuotationProductDraftIn(Schema):
    product_id: Optional[int] = None
    quantity: Optional[int] = None
    unit_price: Optional[int] = None
    is_delivery: bool = False
    delivery_date: Optional[str] = None


# ------------------------------------------------------------
# Quotation API
# ------------------------------------------------------------


# (POST) OCR
class OcrIn(Schema):
    data: str


# ------------------------------------------------------------
# Quotation Product API
# ------------------------------------------------------------


# (POST) Quotation Draft
class QuotationDraftIn(Schema):
    quotation_id: Optional[int] = None
    client: Optional[FactoryClientInfoIn] = None
    products: Optional[List[QuotationProductDraftIn]] = None
    due_date: Optional[str] = None
    uploaded_file: Optional[str] = Field(None, description="업로드 파일 URL")
    is_confirm: bool = False


# (POST) Quotation Confirmed
class QuotationConfirmedIn(Schema):
    quotation_id: int
    client: FactoryClientInfoIn
    products: List[QuotationProductInfoIn]
    due_date: Optional[str] = None


# (PATCH) Quotation Product Delivery Update
class QuotationProductDeliveryUpdateIn(Schema):
    is_delivery: bool
    delivery_date: Optional[str] = None


class QuotationEmailSendIn(Schema):
    email: str = Field(..., description="받는 사람 이메일")
    factory_id: int = Field(..., description="공장 ID")
    client_name: Optional[str] = Field(None, description="고객 이름")
    pdf_data: Optional[str] = Field(
        None, description="Base64로 인코딩된 PDF 파일 데이터"
    )


# ------------------------------------------------------------
# Work Instruction API
# ------------------------------------------------------------


class WorkInstructionFilter(FilterSchema):
    pass


class WorkInstructionUpdateIn(ModelSchema):
    class Meta:
        model = WorkInstruction
        fields = [
            "memo",
        ]
