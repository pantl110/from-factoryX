from ninja import Schema, FilterSchema
from datetime import date
from typing import Optional, List


# ------------------------------------------------------------
# Project API
# ------------------------------------------------------------


# (POST) Project Clone
class ProjectCloneIn(Schema):
    project_id: int

    
# (PATCH) Project Status Update
class ProjectStatusUpdateIn(Schema):
    status: str
    

# (PATCH) Project Transact Date Update
class ProjectTransactDateUpdateIn(Schema):
    transact_date: Optional[date] = None


# ------------------------------------------------------------
# Project Refund API
# ------------------------------------------------------------

# (POST) Refund Create
class RefundCreateIn(Schema):
    project_id: int
    product_id: int
    refund_date: str
    production_amount: Optional[int] = None

# (PATCH) Refund Update
class RefundUpdateIn(Schema):
    refund_date: Optional[str] = None
    current_stock: Optional[int] = None
    production_amount: Optional[int] = None


# ------------------------------------------------------------
# Project Plan API
# ------------------------------------------------------------

# (POST) Project Plan Create
class ProjectPlanCreateIn(Schema):
    project_id: int
    quotation_product_ids: List[int]
    production_quantities: List[int]
    equipment_ids: List[int]
    start_dates: List[str]
    end_dates: List[str]
    avg_production_times: List[int]


# (GET) Project Plan List
class ProjectPlanListFilter(FilterSchema):
    client_name: Optional[str] = None

    def filter(self, qs):
        if self.client_name:
            qs = qs.filter(quotations__client__name__icontains=self.client_name)
        return qs


# (PATCH) Project Plan Update
class ProjectPlanUpdateIn(Schema):
    equipment_id: Optional[int] = None
    quantity: Optional[int] = None
    status: Optional[str] = None
    start_date: Optional[str] = None 
    end_date: Optional[str] = None
    avg_production_time: Optional[int] = None


# ------------------------------------------------------------
# Project Log API
# ------------------------------------------------------------

# (POST) Project Log Create
class ProjectLogCreateIn(Schema):
    project_id: int
    type: str
    title: str
    content: str


# (PATCH) Project Log Update
class ProjectLogUpdateIn(Schema):
    type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None