from ninja import ModelSchema
from unit_conversion.models import UnitConversion
from typing import Optional


class UnitConversionOutSchema(ModelSchema):
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    
    class Meta:
        model = UnitConversion
        fields = "__all__"