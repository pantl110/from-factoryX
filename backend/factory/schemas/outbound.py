from ninja import ModelSchema, Field, Schema
from factory.models import Factory, FactoryEquipment, FactoryClient, FactoryMember
from typing import Optional
from user.models import User


class FactoryOut(ModelSchema):
    class Meta:
        model = Factory
        fields = "__all__"


class FactoryEqOut(ModelSchema):
    class Meta:
        model = FactoryEquipment
        fields = "__all__"


# 거래처 관련 스키마
class FactoryClientOut(Schema):
    id: int
    client_type: str
    name: str
    business_registration_number: Optional[str]
    representative_name: Optional[str]
    business_type: Optional[str]
    business_category: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    note: Optional[str]


class FactoryClientDetailOut(Schema):
    id: int
    client_type: str
    name: str
    business_registration_number: Optional[str]
    representative_name: Optional[str]
    business_type: Optional[str]
    business_category: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    note: Optional[str]


class FactoryMemberOut(Schema):
    id: int
    factory: int
    user: Optional[int]  # int → Optional[int]로 변경
    name: str
    email: str
    role: str
    status: str
    invited_at: Optional[str]  # ISO8601 문자열로 반환

    @classmethod
    def from_orm(cls, obj: FactoryMember):
        return cls(
            id=obj.id,
            factory=obj.factory_id,
            user=obj.user_id,
            name=getattr(obj.user, 'username', '') or getattr(obj.user, 'name', '') or getattr(obj.user, 'email', ''),
            email=getattr(obj.user, 'email', ''),
            role=obj.role,
            status=obj.status,
            invited_at=obj.invited_at.isoformat() if obj.invited_at else None,
        )
