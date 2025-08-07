from ninja import Schema
import datetime
from typing import Optional, List


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


# (GET) Project Status
class ProjectStatusOut(Schema):
    project_id: int
    quotation_id: Optional[int] = None
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    earliest_start_date: Optional[datetime.date] = None
    latest_end_date: Optional[datetime.date] = None
    due_date: Optional[datetime.date] = None


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
    project: dict
    amount: int
    current_stock: int
    production_amount: int
    refund_date: Optional[datetime.date] = None
    log: dict
    created_at: datetime.datetime
    updated_at: datetime.datetime


# ------------------------------------------------------------
# Project Plan API
# ------------------------------------------------------------

# (POST) Project Plan Create
class ProjectPlanDetailOut(Schema):
    id: int
    project_id: int
    quotation_product_id: int
    equipment_id: int
    status: str
    quantity: int
    start_date: datetime.date
    end_date: datetime.date
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
    start_date: datetime.date
    end_date: datetime.date
    avg_production_time: int


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
    created_at: datetime.datetime
    updated_at: datetime.datetime


# (PATCH) Project Log Update
class ProjectLogUpdateOut(Schema):
    message: str
