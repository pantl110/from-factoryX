from ninja import Schema, ModelSchema, Field
import datetime
from typing import Optional, List, Literal
from project.models import Project, ProjectLog, Refund, ProjectPlan
from document.schemas.outbound import QuotationModelOut


# 순환 import 방지를 위한 별도 정의
class NationalTaxServiceOut(Schema):
    id: int
    tax_invoice_type: str
    transaction_date: datetime.date
    client_name: str
    transaction_amount: int
    tax_amount: int
    total_amount: int


# ------------------------------------------------------------
# Project API
# ------------------------------------------------------------


# (POST) Project Create
class ProjectCreateOut(Schema):
    quotation_id: int
    project_id: int


# (POST) Project Clone
class ProjectCloneOut(Schema):
    project_id: int
    message: str


# ProjectLogModel
class ProjectLogModelOut(ModelSchema):
    class Meta:
        model = ProjectLog
        fields = "__all__"


# Refund
class RefundModelOut(Schema):
    class Meta:
        model = Refund
        fields = "__all__"


# (GET) List Progress Project
class ListProgressProjectOut(Schema):
    project_id: int
    quotation_id: int
    client_name: str
    product_names: List[str]
    start_date: Optional[datetime.date] = None
    due_date: Optional[datetime.date] = None
    publish_status: Optional[str] = None
    status: str
    is_abandoned: bool = False
    created_at: str


# (GET) Project Status
class ProjectStatusOut(Schema):
    project_id: int
    quotation_id: Optional[int] = None
    status: str
    is_refunded: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime
    earliest_start_date: Optional[datetime.datetime] = None
    latest_end_date: Optional[datetime.datetime] = None
    due_date: Optional[datetime.date] = None
    tax_invoice: Optional[int] = None


class ProjectStatusDetailOut(ModelSchema):
    earliest_start_date: Optional[datetime.datetime] = None
    latest_end_date: Optional[datetime.datetime] = None
    due_date: Optional[datetime.date] = None
    tax_invoice: Optional[NationalTaxServiceOut] = Field(
        None, description="세금계산서 정보"
    )
    quotations: List[QuotationModelOut] = Field([], description="견적서 정보")
    logs: List[ProjectLogModelOut] = Field([], description="프로젝트 로그 정보")

    class Meta:
        model = Project
        fields = "__all__"


# (PATCH) Project Status Update
class ProjectDetailOut(Schema):
    id: int
    status: str
    transact_date: Optional[datetime.date] = None
    tax_invoice: Optional[int] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime


# (DELETE) Project Delete
class ProjectUpdateOut(Schema):
    message: str


# ------------------------------------------------------------
# Project Refund API
# ------------------------------------------------------------


# (POST) Refund Create
class RefundCreateOut(Schema):
    message: str
    refund_id: int
    log_id: int


# (PATCH) Refund Update
class RefundUpdateOut(Schema):
    message: str
    refund_id: int
    updated_project_plans: List[int]
    deleted_project_plans: List[int]
    created_project_plans: List[int]


# (GET) Refund List
class RefundListOut(Schema):
    id: int
    product_name: str
    product_id: int
    amount: int
    current_stock: int
    production_amount: int
    refund_date: Optional[datetime.date] = None
    project_name: str
    project_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime


# (GET) Refund Detail
class RefundDetailOut(Schema):
    id: int
    product: dict
    project: Optional[dict] = None
    plan: Optional[dict] = None
    amount: int
    refund_date: Optional[datetime.date] = None
    current_stock: int
    production_amount: int
    log: dict
    created_at: datetime.datetime
    updated_at: datetime.datetime


# (POST) Refund Production Registration
class RefundProductionRegistrationOut(Schema):
    message: str
    action: str
    refund_id: int
    quotation_id: int
    quotation_product_id: int
    project_plan_id: int
    log_id: int
    product_name: str
    quantity: int
    equipment_name: str


# ------------------------------------------------------------
# Project Plan API
# ------------------------------------------------------------


class ProjectPlanModelOut(ModelSchema):
    class Meta:
        model = ProjectPlan
        fields = "__all__"


# (POST) Project Plan Create
class ProjectPlanDetailOut(Schema):
    id: int
    project_id: int
    quotation_product_id: int
    equipment_id: int
    status: str
    quantity: int
    start_date: datetime.datetime
    end_date: datetime.datetime
    avg_production_time: int


# (POST) Project Plan Create
class ProjectPlansCreateOut(Schema):
    message: str
    created_plans: List[ProjectPlanDetailOut]


# (GET) Product Detail
class ProductDetailOut(Schema):
    id: int
    name: str
    code: str
    unit: str
    spec: str


# (GET) Quotation Product Detail
class QuotationProductDetailOut(Schema):
    id: int
    product: ProductDetailOut
    quantity: int
    unit_price: int
    is_delivery: Optional[bool] = None
    delivery_date: Optional[datetime.date] = None


# (GET) Equipment Detail
class EquipmentDetailOut(Schema):
    id: int
    name: str
    priority: int


# (GET) Project Plan Detail
class ProjectPlanDetailWithRelationsOut(Schema):
    id: int
    project_id: int
    quotation_product: QuotationProductDetailOut
    equipment: EquipmentDetailOut
    status: str
    quantity: int
    start_date: datetime.datetime
    end_date: datetime.datetime
    avg_production_time: int
    material_status: Literal["충분", "부족"]


# (GET) Daily Production Quantity
class DailyProductionQuantityOut(Schema):
    production_count: int
    production_quantity: int
    previous_month_count: Optional[int] = None
    previous_month_quantity: Optional[int] = None
    change_percentage: Optional[float] = None


# ------------------------------------------------------------
# Project Log API
# ------------------------------------------------------------


# (POST) Project Log Create
class ProjectLogCreateOut(Schema):
    message: str
    log_id: int


# (GET) Project Log Detail
class ProjectLogDetailOut(Schema):
    id: int
    project_id: int
    type: str
    title: str
    content: str
    refund: Optional[RefundDetailOut] = None  # 반품 로그인 경우 반품 ID
    created_at: datetime.datetime
    updated_at: datetime.datetime


# (PATCH) Project Log Update
class ProjectLogUpdateOut(Schema):
    message: str


# ------------------------------------------------------------
# Production Profit Rate API
# ------------------------------------------------------------


class ProductionProfitRateOut(Schema):
    current_month_profit: int
    current_month_count: int
    previous_month_profit: Optional[int] = None
    previous_month_count: Optional[int] = None
    change_percentage: Optional[float] = None


# ------------------------------------------------------------
# Dashboard API
# ------------------------------------------------------------


class DashboardOut(Schema):
    current_month_projects: int  # 이번달에 생성된 프로젝트 건수
    previous_month_projects: int  # 지난달에 생성된 프로젝트 건수
    shortage_materials_count: int  # 재고 수량이 안전재고보다 낮은 원자재 개수
    monthly_profits: List[dict]  # 현재 달로부터 5개월치 월별 생산 수익
    last_year_monthly_profits: List[dict]  # 작년 동일 기간 월별 생산 수익
