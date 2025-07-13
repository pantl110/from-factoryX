from ninja import Schema
import datetime
from typing import Optional

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