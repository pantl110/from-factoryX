from ninja import Schema
from typing import List, Optional
from datetime import date


# Factory Client Field
class FactoryClientInfoIn(Schema):
    type: str = "customer"
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


# Quotation Product Field
class QuotationProductInfoIn(Schema):
    product_id: int
    quantity: int
    unit_price: int
    is_delivery: bool = False
    delivery_date: Optional[str] = None


# (POST) Quotation Draft
class QuotationDraftIn(Schema):   
    factory_id: int
    quotation_id: int
    client: Optional[FactoryClientInfoIn] = None
    products: Optional[List[QuotationProductInfoIn]] = None
    due_date: Optional[str] = None


# (POST) Quotation Production
class QuotationProductionIn(Schema):
    factory_id: int
    quotation_id: int
    client: FactoryClientInfoIn
    products: List[QuotationProductInfoIn]
    due_date: Optional[str] = None


class QuotationProductCreateIn(Schema):
    quotation_id: int
    product_id: int
    quantity: Optional[int] = None
    unit_price: Optional[int] = None
    delivery_date: Optional[date] = None


class QuotationSaveIn(Schema):
    quotation_id: int
    client: FactoryClientInfoIn
    due_date: Optional[str] = None
    products: List[QuotationProductInfoIn]
    action: Optional[str] = None


class OcrIn(Schema):
    data: str



class ProjectPlanIn(Schema):
    """생산 계획 입력 스키마"""
    product_id: int
    equipment_id: Optional[int] = None
    quantity: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    avg_production_time: Optional[int] = None