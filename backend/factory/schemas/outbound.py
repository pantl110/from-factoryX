from ninja import ModelSchema
from factory.models import Factory


class FactoryOut(ModelSchema):
    class Meta:
        model = Factory
        fields = "__all__"
