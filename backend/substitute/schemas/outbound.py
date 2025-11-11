from ninja import Schema, ModelSchema, Field
from typing import List, Optional
from datetime import datetime
from substitute.models import Substitute
from stock.models import Material


class MaterialSimpleOut(ModelSchema):
    current_stock: Optional[int] = Field(None, description="현재 재고량")

    class Meta:
        model = Material
        fields = [
            "id",
            "name",
            "code",
            "unit",
            "spec",
            "current_stock",
        ]


class SubstituteListOut(ModelSchema):
    material_count: int = Field(..., description="대체 자재 수")

    class Meta:
        model = Substitute
        fields = [
            "id",
            "name",
            "factory",
            "description",
            "created_at",
            "updated_at",
        ]


class SubstituteDetailOut(ModelSchema):
    materials: Optional[List[MaterialSimpleOut]] = Field(
        [], description="대체 자재 목록"
    )

    class Meta:
        model = Substitute
        fields = "__all__"
