from ninja import ModelSchema
from unit_conversion.models import UnitConversion


class UnitConversionOutSchema(ModelSchema):
    class Meta:
        model = UnitConversion
        fields = "__all__"