from ninja import Schema, ModelSchema, Field
from typing import Optional, List
from factory.models import Factory, FactoryClient, FactoryMember, FactoryEquipment
from project.schemas.outbound import ProjectPlanModelOut
from subscription.models import Subscription, SubscriptionHistory
from datetime import date


# ------------------------------------------------------------
# Factory API
# ------------------------------------------------------------


# (GET) Factory Equipment
class FactoryEqOut(ModelSchema):
    class Meta:
        model = FactoryEquipment
        fields = "__all__"


class FactoryEqModelOut(ModelSchema):
    plans: Optional[List[ProjectPlanModelOut]] = Field(
        [], description="프로젝트 계획 리스트"
    )

    class Meta:
        model = FactoryEquipment
        fields = "__all__"


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


class FactoryMemberDetailOut(ModelSchema):
    class Meta:
        model = FactoryMember
        fields = "__all__"


# ------------------------------------------------------------
# Factory Client API
# ------------------------------------------------------------


# (GET) Factory Client
class FactoryClientOut(Schema):
    id: int
    # type: str
    is_customer: bool
    is_supplier: bool
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
    # type: str
    is_customer: bool
    is_supplier: bool
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


class FactoryModelOut(ModelSchema):
    members: List[FactoryMemberDetailOut] = Field(..., description="공장 멤버 리스트")
    member: FactoryMemberDetailOut = Field(..., description="현재 로그인 한 멤버 정보")
    trial_end_date: Optional[date] = Field(None, description="무료 체험 종료일")

    class Meta:
        model = Factory
        fields = "__all__"


class SubscriptionOut(ModelSchema):
    class Meta:
        model = Subscription
        fields = "__all__"


class SubscriptionHistoryOut(ModelSchema):
    subscription: SubscriptionOut

    class Meta:
        model = SubscriptionHistory
        exclude = [
            "factory",
        ]


class FactoryModelDetailOut(ModelSchema):
    members: List[FactoryMemberDetailOut] = Field(..., description="공장 멤버 리스트")
    member: FactoryMemberDetailOut = Field(..., description="현재 로그인 한 멤버 정보")
    subscription_histories: Optional[List[SubscriptionHistoryOut]] = Field(
        [], description="구독 이력 리스트"
    )
    trial_end_date: Optional[date] = Field(None, description="무료 체험 종료일")

    class Meta:
        model = Factory
        fields = "__all__"
