from ninja import Schema
from typing import Optional

class QuotationProductOut(Schema):
    id: int
    quotation: int
    product: int
    quantity: int
    unit_price: int
    is_delivery: Optional[bool] = None
    delivery_date: Optional[str] = None