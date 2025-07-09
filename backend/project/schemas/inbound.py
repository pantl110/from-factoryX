from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

class ProjectCreateIn(BaseModel):
    quotation_id: int
    status: Optional[str] = None
    transact_date: Optional[datetime.date] = None

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
