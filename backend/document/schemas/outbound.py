from ninja import Schema
from typing import List, Optional


# Quotation Product Detail
class QuotationDetailProductOut(Schema):
    productId: int
    product_code: Optional[str] = None
    product_name: str
    spec: str
    unit: str
    quantity: int
    unit_price: int
    supply_amount: int
    tax_amount: int


# ------------------------------------------------------------
# Quotation API
# ------------------------------------------------------------

# (GET) Quotation Detail
class QuotationDetailOut(Schema):
    factory_name: Optional[str] = ""
    business_registration_number: Optional[str] = None
    representative_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None
    business_type: Optional[str] = None
    business_category: Optional[str] = None
    address: Optional[str] = None
    due_date: Optional[str] = None
    products: List[QuotationDetailProductOut]


# ------------------------------------------------------------
# Quotation Product API
# ------------------------------------------------------------

# (GET) Quotation Product Detail
class QuotationProductOut(Schema):
    id: int
    quotation: int
    product: int
    quantity: Optional[int] = None
    unit_price: Optional[int] = None
    is_delivery: Optional[bool] = None
    delivery_date: Optional[str] = None