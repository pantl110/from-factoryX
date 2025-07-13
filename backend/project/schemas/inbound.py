from ninja import Schema
from datetime import date
from typing import Optional

# for create_project method
class ProjectCreateIn(Schema):
    id:int

# for update_project_status method
class ProjectStatusUpdateIn(Schema):
    status: str

# for update_project_transact_date method
class ProjectTransactDateUpdateIn(Schema):
    transact_date: Optional[date] = None
