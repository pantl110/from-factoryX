from ninja import ModelSchema, Field
from factory.models import Factory, FactoryEquipment, FactoryClient
from typing import Optional


class FactoryCreateIn(ModelSchema):
    class Meta:
        model = Factory
        exclude = [
            "id",
            "owner",
            "created_at",
            "updated_at",
        ]


class FactoryUpdateIn(ModelSchema):
    name: Optional[str] = Field(default=None, description="공장 이름")

    class Meta:
        model = Factory
        exclude = [
            "id",
            "owner",
            "created_at",
            "updated_at",
        ]


class FactoryEqCreateIn(ModelSchema):
    # accept factory PK directly
    factory: int

    class Meta:
        model = FactoryEquipment
        exclude = [
            "id",
# 거래처 관련 스키마
class FactoryClientCreateIn(ModelSchema):
    class Meta:
        model = FactoryClient
        exclude = [
            "id",
            "factory",
            "created_at",
            "updated_at",
        ]


class FactoryEqUpdateIn(ModelSchema):
    name: Optional[str] = Field(default=None, description="공장 설비 이름")
    factory: Optional[int] = Field(default=None, description="공장 ID")
    priority: Optional[int] = Field(default=None, description="우선순위")
    note: Optional[str] = Field(default=None, description="설비 설명")
    status: Optional[str] = Field(default=None, description="설비 상태")
    location: Optional[str] = Field(default=None, description="설비 위치")
    
    class Meta:
        model = FactoryEquipment
        exclude = [
            "id",
# 거래처 관련 스키마
class FactoryClientUpdateIn(ModelSchema):
    class Meta:
        model = FactoryClient
        exclude = [
            "id",
            "factory",
            "created_at",
            "updated_at",
        ]
