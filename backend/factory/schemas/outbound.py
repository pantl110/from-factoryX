from ninja import ModelSchema
from factory.models import Factory, FactoryClient


class FactoryOut(ModelSchema):
    class Meta:
        model = Factory
        fields = "__all__"

# 거래처 관련 스키마
class FactoryClientOut(ModelSchema):
    class Meta:
        model = FactoryClient
        fields = "__all__"
