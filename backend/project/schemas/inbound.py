from ninja import Schema
from datetime import date
from typing import Optional, List

# for create_project method
class ProjectCreateIn(Schema):
    id:int

# for update_project_status method
class ProjectStatusUpdateIn(Schema):
    status: str

# for update_project_transact_date method
class ProjectTransactDateUpdateIn(Schema):
    transact_date: Optional[date] = None

# for create_project_plans method
class ProjectPlanCreateIn(Schema):
    project_id: int
    quotation_product_ids: List[int]
    production_quantities: List[int]
    equipment_ids: List[int]
    start_dates: List[date]
    end_dates: List[date]
    avg_production_times: List[int]
