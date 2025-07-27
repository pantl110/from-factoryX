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


class OcrIn(Schema):
    data: str


class QuotationDraftIn(Schema):
    """견적서 임시 저장 입력 스키마"""
    quotation_id: int
    client: Optional[dict] = None  # 선택적 클라이언트 정보
    products: List[dict] = []  # 빈 리스트도 허용
    due_date: Optional[str] = None  # 선택적 납기일자


class ProjectPlanIn(Schema):
    """생산 계획 입력 스키마"""
    product_id: int
    equipment_id: Optional[int] = None
    quantity: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    avg_production_time: Optional[int] = None


class QuotationProductionIn(Schema):
    """견적서 생산 시작 입력 스키마"""
    quotation_id: int
    client: Optional[dict] = None  # 선택적 클라이언트 정보 (API에서 검증)
    products: Optional[List[dict]] = None  # 선택적 품목 정보 (API에서 검증)
    due_date: Optional[str] = None  # 선택적 납기일자 (API에서 검증)
