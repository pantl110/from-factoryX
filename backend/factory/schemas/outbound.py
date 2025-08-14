from ninja import Schema, ModelSchema
from typing import Optional, List
from project.schemas.outbound import ProjectPlanDetailOut
from factory.models import Factory, FactoryClient


# ------------------------------------------------------------
# Factory API
# ------------------------------------------------------------


# (GET) Factory
class FactoryOut(Schema):
    id: int
    owner: int
    name: Optional[str]
    business_registration_number: Optional[str]
    representative_name: Optional[str]
    manager_email: Optional[str]
    manager_phone: Optional[str]
    manager_fax: Optional[str]
    business_type: Optional[str]
    business_category: Optional[str]
    business_address: Optional[str]
    is_trial: bool
    billing_key: Optional[str]
    inviting: list
    created_at: str
    updated_at: str
    invited_at: Optional[str]
    role: Optional[str]
    invited_by: Optional[int]


# (GET) Factory Equipment
class FactoryEqOut(Schema):
    id: int
    factory: int
    name: str
    status: str
    priority: int
    location: Optional[str]
    note: Optional[str]
    created_at: str
    updated_at: str


class FactoryEqDetailOut(Schema):
    id: int
    factory: int
    name: str
    status: str
    priority: int
    location: Optional[str]
    note: Optional[str]
    created_at: str
    updated_at: str
    history: List[ProjectPlanDetailOut]


# ------------------------------------------------------------
# Factory Member API
# ------------------------------------------------------------


# (GET) Factory Member
class FactoryMemberOut(Schema):
    id: int
    factory: int
    user: Optional[int]
    name: str
    email: str
    role: str
    status: str
    invited_at: Optional[str]


# ------------------------------------------------------------
# Factory Client API
# ------------------------------------------------------------


# (GET) Factory Client
class FactoryClientOut(Schema):
    id: int
    type: str
    name: str
    business_registration_number: Optional[str]
    representative_name: Optional[str]
    business_type: Optional[str]
    business_category: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    fax: Optional[str]
    address: Optional[str]
    manager: Optional[str]
    note: Optional[str]


# (GET) Factory Client Detail
class FactoryClientDetailOut(Schema):
    id: int
    type: str
    name: str
    business_registration_number: Optional[str]
    representative_name: Optional[str]
    business_type: Optional[str]
    business_category: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    fax: Optional[str]
    address: Optional[str]
    manager: Optional[str]
    note: Optional[str]


class FactoryRowOut(ModelSchema):
    class Meta:
        model = Factory
        exclude = [
            "inviting",
            "created_at",
            "updated_at",
        ]


class FactoryClientRowOut(ModelSchema):
    class Meta:
        model = FactoryClient
        exclude = [
            "created_at",
            "updated_at",
        ]
