from ninja import Schema
from typing import List, Optional


class QuotationProductOut(Schema):
    """견적서 품목 출력 스키마"""
    id: int
    quotation: int
    product: int
    quantity: Optional[int] = None
    unit_price: Optional[int] = None
    is_delivery: Optional[bool] = None
    delivery_date: Optional[str] = None


class QuotationDraftOut(Schema):
    """견적서 임시 저장 출력 스키마"""
    quotation_id: int
    status: str


class QuotationProductionOut(Schema):
    """견적서 생산 시작 출력 스키마"""
    quotation_id: int
    project_id: int
    status: str


class QuotationProductHistoryOut(Schema):
    """견적서 품목 히스토리 출력 스키마"""
    product_name: str
    quantity: int
    unit_price: int
    total_amount: int


class QuotationProductHistoryListOut(Schema):
    """견적서 품목 히스토리 목록 출력 스키마"""
    results: List[QuotationProductHistoryOut]