from ninja import Schema
from typing import Optional

class QuotationProductOut(Schema):
    id: int
    quotation: int
    product: int
    quantity: Optional[int] = None
    unit_price: Optional[int] = None
    is_delivery: Optional[bool] = None
    delivery_date: Optional[str] = None