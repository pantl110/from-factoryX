from pydantic import BaseModel
from typing import Optional, List
import datetime

class ProjectOut(BaseModel):
    id: int
    status: str
    transact_date: Optional[datetime.date]
    tax_invoice_id: Optional[int]
    created_at: datetime.datetime
    updated_at: datetime.datetime

class ProjectPlanOut(BaseModel):
    id: int
    project_id: int
    product_id: int
    quantity: int
    equipment_id: int
    start_date: datetime.date
    end_date: datetime.date
    avg_production_time: int
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

class ProjectLogOut(BaseModel):
    id: int
    project_id: int
    type: str
    title: str
    content: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
