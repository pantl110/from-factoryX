from ninja import ModelSchema
from unit_conversion.models import UnitConversion
from typing import Optional


class UnitConversionOutSchema(ModelSchema):
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    product_name: Optional[str] = None
    product_code: Optional[str] = None

    @staticmethod
    def resolve_material_name(obj):
        return obj.material.name if obj.material else None

    @staticmethod
    def resolve_material_code(obj):
        return obj.material.code if obj.material else None

    @staticmethod
    def resolve_product_name(obj):
        return obj.product.name if obj.product else None

    @staticmethod
    def resolve_product_code(obj):
        return obj.product.code if obj.product else None
    
    class Meta:
        model = UnitConversion
        fields = "__all__"