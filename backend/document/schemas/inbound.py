from ninja import Schema
from typing import List, Optional
from datetime import date


class ClientInfoIn(Schema):
    name: str
    business_registration_number: str
    representative_name: str
    business_type: str
    business_category: str
    address: str
    manager: str
    email: str
    phone: str
    fax: str

class ProductInfoIn(Schema):
    id: int
    name: str
    code: str
    spec: str
    unit: str
    quantity: int
    unit_price: int
    amount: int

class QuotationProductCreateIn(Schema):
    quotation_id: int
    product_id: int
    quantity: int
    unit_price: int
    delivery_date: Optional[date] = None

class QuotationSaveIn(Schema):
    quotation_id: int
    client: ClientInfoIn
    due_date: str
    products: List[ProductInfoIn]
    action: str

