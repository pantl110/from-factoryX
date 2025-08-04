from ninja import Field, FilterSchema, Schema
from typing import Optional


# ------------------------------------------------------------
# Factory API
# ------------------------------------------------------------

# (PATCH) Factory Update
class FactoryUpdateIn(Schema):
    name: Optional[str] = None
    business_registration_number: Optional[str] = None
    representative_name: Optional[str] = None
    manager_email: Optional[str] = None
    manager_phone: Optional[str] = None
    manager_fax: Optional[str] = None
    business_type: Optional[str] = None
    business_category: Optional[str] = None
    business_address: Optional[str] = None
    is_trial: Optional[bool] = None
    billing_key: Optional[str] = None


# ------------------------------------------------------------
# Factory Member API
# ------------------------------------------------------------

# (POST) Factory Member Invite
class InviteMemberIn(Schema):
    email: str
    role: str


# (PATCH) Factory Member Update
class FactoryMemberUpdateIn(Schema):
    role: Optional[str] = None
    status: Optional[str] = None


# ------------------------------------------------------------
# Factory Equipment API
# ------------------------------------------------------------

# (POST) Factory Equipment Create
class FactoryEqCreateIn(Schema):
    name: str
    status: Optional[str] = None
    priority: int
    location: Optional[str] = None
    note: Optional[str] = None


# (GET) Factory Equipment Filter
class FactoryEqFilter(FilterSchema):
    name: Optional[str] = Field(default=None, q="name__icontains")
    status: Optional[str] = Field(default=None, q="status")
    location: Optional[str] = Field(default=None, q="location__icontains")
    priority: Optional[int] = Field(default=None, q="priority")


# (PATCH) Factory Equipment Update
class FactoryEqUpdateIn(Schema):
    name: Optional[str] = None
    factory: Optional[int] = None
    priority: Optional[int] = None
    note: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None


# ------------------------------------------------------------
# Factory Client API
# ------------------------------------------------------------

# (POST) Factory Client Create
class FactoryClientCreateIn(Schema):
    type: Optional[str] = None
    name: str
    business_registration_number: Optional[str] = None
    representative_name: Optional[str] = None
    business_type: Optional[str] = None
    business_category: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    fax: Optional[str] = None
    address: Optional[str] = None
    manager: Optional[str] = None
    note: Optional[str] = None


# (PATCH) Factory Client Update
class FactoryClientUpdateIn(Schema):
    id: Optional[int] = None
    client_type: Optional[str] = None
    name: Optional[str] = None
    business_registration_number: Optional[str] = None
    representative_name: Optional[str] = None
    business_type: Optional[str] = None
    business_category: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    fax: Optional[str] = None
    address: Optional[str] = None
    manager: Optional[str] = None
    note: Optional[str] = None


# (GET) Factory Client Search Filter
class FactoryClientSearchFilter(FilterSchema):
    q: Optional[str] = None