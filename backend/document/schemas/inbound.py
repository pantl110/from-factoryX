from ninja import Schema
from typing import List, Optional


# Factory Client Field
class FactoryClientInfoIn(Schema):
    type: str = "customer"
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


# Quotation Product Field
class QuotationProductInfoIn(Schema):
    product_id: int
    quantity: int
    unit_price: int
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
    quotation_id: int
    client: Optional[FactoryClientInfoIn] = None
    products: Optional[List[QuotationProductInfoIn]] = None
    due_date: Optional[str] = None


# (POST) Quotation Confirmed
class QuotationConfirmedIn(Schema):
    quotation_id: int
    client: FactoryClientInfoIn
    products: List[QuotationProductInfoIn]
    due_date: Optional[str] = None