from ninja import ModelSchema, Field, FilterSchema, Schema
from typing import Optional, List
from location.models import Location

class LocationCreateIn(ModelSchema):
    factory_id: int = Field(description="공장 ID")
    type: str = Field(description="위치 타입(material/product)")
    location: str = Field(description="위치명")
    images: Optional[List[str]] = Field(default=None, description="이미지 URL 목록")

    class Meta:
        model = Location
        exclude = ["id", "created_at", "updated_at"]

class LocationUpdateIn(ModelSchema):
    location_id: int = Field(description="위치 ID")
    factory_id: int = Field(description="공장 ID")
    type: Optional[str]
    location: Optional[str]
    images: Optional[List[str]]

    class Meta:
        model = Location
        exclude = ["id", "created_at", "updated_at"]

class LocationDeleteIn(Schema):
    factory_id: int
    location_id: int

class LocationDetailIn(Schema):
    factory_id: int
    location_id: int

class LocationFilter(FilterSchema):
    type: Optional[str] = Field(default=None, q="type", description="위치 타입")
    location: Optional[str] = Field(default=None, q="location__icontains", description="위치명")
