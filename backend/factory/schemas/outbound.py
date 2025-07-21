from ninja import ModelSchema, Field, Schema
from factory.models import Factory, FactoryEquipment, FactoryClient, FactoryMember
from typing import Optional


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


class FactoryMemberOut(ModelSchema):
    class Meta:
        model = FactoryMember
        fields = '__all__'
