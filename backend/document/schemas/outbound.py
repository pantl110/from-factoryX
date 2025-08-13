from ninja import Schema
from typing import List, Optional
from datetime import datetime
from pydantic import field_validator


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


# (POST) Quotation Confirmed Response
class QuotationConfirmedOut(Schema):
    quotation_id: int
    project_id: int
    status: str
    created_at: datetime
    due_date: Optional[str] = None
    production_plans: List[dict]  # 생산 계획 정보


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


# (GET) Undelivered Quotation Products
class UndeliveredQuotationProductOut(Schema):
    company_name: str  # 업체명 (클라이언트명)
    product_name: str  # 품목명
    delivery_date: Optional[str] = None  # 납품일자
    project_id: int  # 프로젝트 ID


# (GET) Today's Production Plans
class TodayProductionPlanOut(Schema):
    company_name: str  # 업체명 (클라이언트명)
    product_name: str  # 품목명
    product_code: Optional[str] = None  # 품목코드
    spec: str  # 규격
    unit: str  # 단위
    production_quantity: int  # 생산 수량
    equipment_name: str  # 생산 설비
    production_time: int  # 생산 시간 (초)
    project_id: int  # 프로젝트 ID


# OCR 결과 아이템 스키마
class OCRRequestItemOut(Schema):
    item_name: str  # 품목명
    item_code: Optional[str] = ""  # 품목코드
    spec: Optional[str] = ""  # 규격
    unit: str  # 단위
    quantity: str  # 수량
    unit_price: str  # 단가


# OCR 결과 클라이언트 정보 스키마
class OCRClientInfoOut(Schema):
    company_name: str  # 업체명
    registration_number: Optional[str] = ""  # 사업자등록번호
    ceo_name: Optional[str] = ""  # 대표자명
    delivery_date: Optional[str] = ""  # 납품일자
    business_type: Optional[str] = ""  # 업태
    category: Optional[str] = ""  # 종목
    address: Optional[str] = ""  # 주소
    manager_name: Optional[str] = ""  # 담당자명
    email: Optional[str] = ""  # 이메일
    fax_number: Optional[str] = ""  # 팩스번호
    call_number: Optional[str] = ""  # 전화번호

    @field_validator("ceo_name", mode="before")
    @classmethod
    def remove_spaces_from_ceo_name(cls, v):
        if v:
            return v.replace(" ", "")
        return v


# OCR 결과 전체 스키마
class OCRResultOut(Schema):
    client_info: OCRClientInfoOut  # 클라이언트 정보
    request_items: List[OCRRequestItemOut]  # 요청 품목 리스트
