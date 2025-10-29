from ninja import ModelSchema, Schema
from typing import Optional, Literal
from unit_conversion.models import UnitConversion
from decimal import Decimal

DecimalRuleType = Literal['round', 'floor', 'ceil']


class UnitConversionCreateSchema(Schema):
    factory_id: int
    material_id: Optional[int] = None
    product_id: Optional[int] = None
    from_unit: Optional[str] = None
    to_unit: Optional[str] = None
    from_quantity: Optional[Decimal] = 1  
    to_quantity: Optional[Decimal] = 1    
    decimal_rule: DecimalRuleType = 'round'