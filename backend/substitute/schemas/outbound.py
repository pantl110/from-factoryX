from ninja import ModelSchema, Field
from typing import List, Optional
from substitute.models import Substitute
from stock.models import Material


class MaterialSimpleOut(ModelSchema):
    current_stock: Optional[int] = Field(None, description="현재 재고량")
    standard_stock: Optional[int] = Field(None, description="안전 재고량")

    class Meta:
        model = Material
        fields = [
            "id",
            "name",
            "code",
            "unit",
            "spec",
            "current_stock",
            "standard_stock",
        ]


class SubstituteDetailOut(ModelSchema):
    source_material: MaterialSimpleOut = Field(..., description="원본 자재")
    target_materials: List[MaterialSimpleOut] = Field(
        default=[], description="대체 가능한 자재 목록 (단방향)"
    )

    class Meta:
        model = Substitute
        fields = [
            "id",
            "factory",
            "created_at",
            "updated_at",
        ]
