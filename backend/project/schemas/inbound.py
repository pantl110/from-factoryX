from ninja import Schema, FilterSchema
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
    start_dates: List[str]
    end_dates: List[str]
    avg_production_times: List[int]


# for update_project_plan method
class ProjectPlanUpdateIn(Schema):
    equipment_id: Optional[int] = None
    quantity: Optional[int] = None
    status: Optional[str] = None
    start_date: Optional[str] = None 
    end_date: Optional[str] = None
    avg_production_time: Optional[int] = None


# for project plan list filters
class ProjectPlanListFilter(FilterSchema):
    client_name: Optional[str] = None  # FactoryClient의 회사명으로 검색

    def filter(self, qs):
        if self.client_name:
            qs = qs.filter(quotations__client__name__icontains=self.client_name)
        return qs

# list_progress_project
class ListProgressProjectIn(Schema):
    factory_id: int
    status: str  # "progress" 또는 "complete"


class ProjectCloneIn(Schema):
    project_id: int