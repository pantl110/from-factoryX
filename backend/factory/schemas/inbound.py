from ninja import ModelSchema, Field
from factory.models import Factory, FactoryEquipment
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
    class Meta:
        model = FactoryEquipment
        exclude = [
            "id",
            "created_at",
            "updated_at",
        ]


class FactoryEqUpdateIn(ModelSchema):
    name: Optional[str] = Field(default=None, description="공장 설비 이름")

    class Meta:
        model = FactoryEquipment
        exclude = [
            "id",
            "created_at",
            "updated_at",
        ]
