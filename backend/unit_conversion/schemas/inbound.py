from ninja import ModelSchema, Schema, Field, FilterSchema
from typing import Optional, Literal
from unit_conversion.models import UnitConversion
from decimal import Decimal

DecimalRuleType = Literal['round', 'floor', 'ceil']


class UnitConversionCreateSchema(Schema):
    id: Optional[int] = None
    factory_id: int
    material_id: Optional[int] = None
    product_id: Optional[int] = None
    from_unit: Optional[str] = None
    to_unit: Optional[str] = None
    from_quantity: Optional[Decimal] = Decimal("1")
    to_quantity: Optional[Decimal] = Decimal("1")
    decimal_rule: DecimalRuleType = 'round'


class UnitConversionFilter(FilterSchema):
    """단위변환 목록 조회 필터"""
    material_name: Optional[str] = Field(default=None, q="material__name__icontains")
    product_name: Optional[str] = Field(default=None, q="product__name__icontains")