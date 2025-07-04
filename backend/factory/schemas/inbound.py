from ninja import ModelSchema, Field
from factory.models import Factory, FactoryClient
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
