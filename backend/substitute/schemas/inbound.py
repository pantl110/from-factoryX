from ninja import ModelSchema, Field
from typing import List, Optional
from substitute.models import Substitute


class SubstituteIn(ModelSchema):
    class Meta:
        model = Substitute
        exclude = [
            "id",
            "factory",
            "created_at",
            "updated_at",
        ]


class SubstituteUpdateIn(ModelSchema):
    materials: Optional[List[int]] = Field(None, description="대체 자재 ID 목록")

    class Meta:
        model = Substitute
        exclude = [
            "id",
            "factory",
            "created_at",
            "updated_at",
        ]
