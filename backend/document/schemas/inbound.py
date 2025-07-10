from ninja import Schema
from typing import Optional
from datetime import date


""" 견적서 생성을 위한 스키마 """
class QuotationCreateIn(Schema):
    # 프로젝트 ID만 받아서 연결
    project_id: int


class QuotationProductCreateIn(Schema):
    quotation_id: int
    product_id: int
    quantity: int
    unit_price: int
    is_delivery: Optional[bool] = False
    delivery_date: Optional[date] = None