from ninja import ModelSchema, Schema
from typing import Optional
from unit_conversion.models import UnitConversion


class UnitConversionCreateSchema(Schema):
    factory_id: int
    material_id: Optional[int] = None
    product_id: Optional[int] = None
    from_unit: Optional[str] = None
    to_unit: Optional[str] = None
    conversion_rate: float = 1.0