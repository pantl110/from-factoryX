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


# (GET) List Progress Project
class ListProgressProjectOut(Schema):
    project_id: int
    client_name: str
    product_names: List[str]
    start_date: datetime.date
    due_date: datetime.date
    publish_status: Optional[str] = None
    status: str
    is_abandoned: bool = False


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

# for project plan response
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

# for create project plans response
class ProjectPlansCreateOut(Schema):
    message: str
    created_plans: List[ProjectPlanDetailOut]


# for detailed project plan response (with related objects)
class ProductDetailOut(Schema):
    id: int
    name: str
    code: str
    unit: str
    spec: str

class QuotationProductDetailOut(Schema):
    id: int
    product: ProductDetailOut
    quantity: int
    unit_price: int

class EquipmentDetailOut(Schema):
    id: int
    name: str
    priority: int

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

class ProjectLogDetailOut(Schema):
    id: int
    project_id: int
    type: str
    title: str
    content: str

# for project log create request
class ProjectLogCreateIn(Schema):
    project_id: int
    type: str
    title: str
    content: str

# for project log update request
class ProjectLogUpdateIn(Schema):
    type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None

# for project log create/update response
class ProjectLogCreateOut(Schema):
    message: str
    log_id: int

class ProjectLogUpdateOut(Schema):
    message: str

# for refund create request
class RefundCreateIn(Schema):
    project_id: int
    product_id: int
    refund_date: str  # YYYY-MM-DD 형식
    production_amount: Optional[int] = None

# for refund create response
class RefundCreateOut(Schema):
    message: str
    refund_id: int
    log_id: int

# for refund update request
class RefundUpdateIn(Schema):
    refund_date: Optional[str] = None  # YYYY-MM-DD 형식
    current_stock: Optional[int] = None
    production_amount: Optional[int] = None

# for refund update response
class RefundUpdateOut(Schema):
    message: str
    refund_id: int