from ninja import ModelSchema
from factory.models import Factory, FactoryEquipment


class FactoryOut(ModelSchema):
    class Meta:
        model = Factory
        fields = "__all__"

class FactoryEqOut(ModelSchema):
    class Meta:
        model = FactoryEquipment
        fields = "__all__"
