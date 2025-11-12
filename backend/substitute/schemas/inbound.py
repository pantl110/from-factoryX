from ninja import ModelSchema, Field
from typing import List
from substitute.models import Substitute


class SubstituteIn(ModelSchema):
    source_material_id: int = Field(..., description="원본 자재 ID (이 자재의 대체 가능한 자재들을 정의)")
    target_materials: List[int] = Field(..., description="대체 가능한 자재 ID 목록 (단방향)")

    class Meta:
        model = Substitute
        exclude = [
            "id",
            "factory",
            "source_material",
            "target_materials",
            "created_at",
            "updated_at",
        ]


