from ninja import Schema, FilterSchema, Field
from datetime import date
from typing import Optional, List
from enum import Enum
from datetime import datetime
from pydantic import field_validator
from project.models import ProjectPlan
from django.db.models import Q


# ------------------------------------------------------------
# Project API
# ------------------------------------------------------------


# (POST) Project Clone
class ProjectCloneIn(Schema):
    project_id: int


# (PATCH) Project Status Update
class ProjectStatusUpdateIn(Schema):
    status: str
    is_printed: Optional[bool] = Field(
        None, description="거래명세서 출력 여부 (printed_at 업데이트 용)"
    )


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
    refund_amount: Optional[int] = None


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


class ProjectFilter(FilterSchema):
    status: Optional[str] = Field(
        None,
        description="ProjectStatusEnum",
        example=",".join([e.value for e in ProjectStatusEnum]),
    )
    status_exclude: Optional[str] = Field(
        None,
        description="ProjectStatusEnum",
        example=",".join([e.value for e in ProjectStatusEnum]),
    )
    search: Optional[str] = Field(
        None,
        q=[
            "quotations__client__name__icontains",
            "quotations__products__product__name__icontains",
        ],
        expression_connector="OR",
        description="검색 키워드",
    )
    printed_at__isnull: Optional[bool] = Field(
        None,
        q="printed_at__isnull",
        description="거래명세서 출력 여부 (printed_at 필드 기준 True: 출력 안됨, False: 출력됨)",
    )

    def filter_status(self, value):
        q = Q()
        if value:
            status_filter = value.split(",")
            q &= Q(status__in=status_filter)
        return q

    def filter_status_exclude(self, value):
        q = Q()
        if value:
            status_exclude_filter = value.split(",")
            q &= ~Q(status__in=status_exclude_filter)
        return q


class ProjectListFilter(FilterSchema):
    status: Optional[str] = Field(
        None,
        description="ProjectStatusEnum",
        example="".join([e.value for e in ProjectStatusEnum]),
    )
    search: Optional[str] = None
    order_by: Optional[str] = "start_date"
    order_dir: Optional[str] = "asc"

    def filter(self, qs):
        if self.status:
            status_filter = self.status.split(",")
            qs = qs.filter(status__in=status_filter)
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


# (POST) Project Plan Create or Update
class ProjectPlanCreateOrUpdateIn(Schema):
    plan_id: Optional[int] = None
    project_id: int
    quotation_product_id: int
    equipment_id: int
    quantity: int  # 생산 수량
    defective_quantity: Optional[int] = Field(0, description="불량품 수량")
    start_date: datetime
    end_date: datetime
    avg_production_time: int
    status: Optional[str] = None
    # total_amount: int  # 총 주문 수량 (buffer_rate 계산 용)
    # total_quantity: int  # 총 생산 수량 (buffer_rate 계산 용)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in [
            value[0] for value in ProjectPlan.ProductionStatus.choices
        ]:
            raise ValueError("유효하지 않는 상태값입니다.")
        return v

    @field_validator("avg_production_time")
    @classmethod
    def validate_avg_production_time(cls, v):
        if v <= 0:
            raise ValueError("평균 생산 시간은 0보다 커야 합니다.")
        return v

    @field_validator("defective_quantity")
    @classmethod
    def validate_defective_quantity(cls, v):
        if v is not None and v < 0:
            raise ValueError("불량품 수량은 0보다 크거나 같아야 합니다.")
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
