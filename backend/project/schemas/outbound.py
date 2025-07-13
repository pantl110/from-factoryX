from ninja import Schema
import datetime
from typing import Optional, List

# for create_project method
class ProjectCreateOut(Schema):
    id:int

# for project detail response
class ProjectDetailOut(Schema):
    id: int
    status: str
    transact_date: Optional[datetime.date] = None
    tax_invoice: Optional[int] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

# for update response
class ProjectUpdateOut(Schema):
    message: str

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