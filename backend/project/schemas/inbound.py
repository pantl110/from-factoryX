from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

class ProjectCreateIn(BaseModel):
    # 프로젝트 정보
    status: Optional[str] = None
    transact_date: Optional[datetime.date] = None
    
    # 견적서 생성 정보
    factory_id: int
    client_id: int
    due_date: datetime.date
    uploaded_file: Optional[str] = None
    
    # 견적서 제품 정보
    products: List[dict] = Field(default_factory=list)  # [{"product_id": int, "quantity": int, "unit_price": int}]

class ProjectUpdateIn(BaseModel):
    status: Optional[str] = None
    transact_date: Optional[datetime.date] = None
    tax_invoice_id: Optional[int] = None

class ProjectPlanCreateIn(BaseModel):
    product_id: int
    quantity: int
    equipment_id: int
    start_date: datetime.date
    end_date: datetime.date
    avg_production_time: int
    status: Optional[str] = None

class ProjectPlanUpdateIn(BaseModel):
    status: Optional[str] = None
    quantity: Optional[int] = None
    equipment_id: Optional[int] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    avg_production_time: Optional[int] = None

class ProjectLogCreateIn(BaseModel):
    type: str
    title: str
    content: str
