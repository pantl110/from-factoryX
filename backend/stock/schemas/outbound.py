from ninja import ModelSchema
from stock.models import Material, MaterialHistory
from factory.models import FactoryClient


class MaterialOut(ModelSchema):
    class Meta:
        model = Material
        exclude = ["products"]


class MaterialHistoryOut(ModelSchema):
    class Meta:
        model = MaterialHistory
        fields = "__all__"


class MaterialDetailOut(ModelSchema):
    class Meta:
        model = Material
        exclude = ["products"]


class MaterialHistoryDetailOut(ModelSchema):
    client_name: str = ""
    
    class Meta:
        model = MaterialHistory
        fields = "__all__"
