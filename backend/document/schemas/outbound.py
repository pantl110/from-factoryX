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


class QuotationDetailProductOut(Schema):
    """견적서 조회 - 품목 상세 정보"""
    product_name: str
    spec: str
    unit: str
    quantity: int
    unit_price: int
    supply_amount: int  # 공급가액
    tax_amount: int     # 세액


class QuotationDetailOut(Schema):
    """견적서 조회 - 상세 정보"""
    # 판매처 정보 (본인 공장)
    factory_name: str
    business_registration_number: Optional[str] = None
    representative_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None
    business_type: Optional[str] = None
    business_category: Optional[str] = None
    address: Optional[str] = None
    
    # 주문 품목 정보
    products: List[QuotationDetailProductOut]