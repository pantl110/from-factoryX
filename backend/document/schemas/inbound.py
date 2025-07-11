from ninja import Schema
from typing import List, Optional
from datetime import date


class ClientInfoIn(Schema):
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

class ProductInfoIn(Schema):
    id: Optional[int] = None
    name: Optional[str] = None
    code: Optional[str] = None
    spec: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[int] = None
    amount: Optional[int] = None
    is_delivery: Optional[bool] = False
    delivery_date: Optional[str] = None

class QuotationProductCreateIn(Schema):
    quotation_id: int
    product_id: int
    quantity: Optional[int] = None
    unit_price: Optional[int] = None
    delivery_date: Optional[date] = None

class QuotationSaveIn(Schema):
    quotation_id: int
    client: ClientInfoIn
    due_date: Optional[str] = None
    products: List[ProductInfoIn]
    action: Optional[str] = None

