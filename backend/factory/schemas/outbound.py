from ninja import ModelSchema
from factory.models import Factory, FactoryEquipment, FactoryClient


class FactoryOut(ModelSchema):
    class Meta:
        model = Factory
        fields = "__all__"


class FactoryEqOut(ModelSchema):
    class Meta:
        model = FactoryEquipment
        fields = "__all__"


# 거래처 관련 스키마
class FactoryClientOut(ModelSchema):
    class Meta:
        model = FactoryClient
        fields = "__all__"
