from ninja import Field, FilterSchema, Schema
from typing import Optional
from pydantic import field_validator


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
    billing_key: Optional[str] = None

    @field_validator('business_registration_number')
    @classmethod
    def validate_business_registration_number(cls, v):
        return "".join(filter(str.isdigit, v)) if v else v


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
    # type: Optional[str] = None
    is_customer: Optional[bool] = None
    is_supplier: Optional[bool] = None
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
    # client_type: Optional[str] = None
    is_customer: Optional[bool] = None
    is_supplier: Optional[bool] = None
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
    # 입금 확인 정보 (수주처용)
    depositor_name: Optional[str] = None
    # 지급 계좌 정보 (발주처용)
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_holder: Optional[str] = None


# (GET) Factory Client Search Filter
class FactoryClientSearchFilter(FilterSchema):
    q: Optional[str] = None
