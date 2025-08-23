from ninja import Schema, FilterSchema
from datetime import date
from typing import Optional, List
from enum import Enum
from datetime import datetime
from pydantic import field_validator
from project.models import ProjectPlan


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
    product_id: Optional[int] = None


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


# (GET) Project List
class ProjectStatusEnum(str, Enum):
    progress = "progress"
    archived = "archived"
    suspended = "suspended"
    quotation = "quotation"
    confirmed = "confirmed"
    pending = "pending"
    production = "production"
    manufactured = "manufactured"
    delivery = "delivery"
    completed = "completed"


class ProjectListFilter(FilterSchema):
    status: ProjectStatusEnum
    search: Optional[str] = None
    order_by: Optional[str] = "start_date"
    order_dir: Optional[str] = "asc"

    def filter(self, qs):
        if self.status:
            qs = qs.filter(status=self.status.value)
        if self.search:
            qs = qs.filter(quotations__client__name__icontains=self.search) | qs.filter(
                quotations__products__product__name__icontains=self.search
            )
        return qs


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
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    avg_production_time: Optional[int] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in [value[0] for value in ProjectPlan.ProductionStatus.choices]:
            raise ValueError("유효하지 않는 상태값입니다.")
        return v

    @field_validator("avg_production_time")
    @classmethod
    def validate_avg_production_time(cls, v):
        if v is not None and v <= 0:
            raise ValueError("평균 생산 시간은 0보다 커야 합니다.")
        return v


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


# (POST) Refund Production Registration
class RefundProductionRegistrationIn(Schema):
    amount: int
    production_amount: int
    refund_date: str
