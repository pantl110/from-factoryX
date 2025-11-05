from ninja import Schema
from typing import Optional, List

class LocationCreateIn(Schema):
    id: int
    type: str
    location: str
    detail_location: Optional[str] = None
    memo: Optional[str] = None
    images: Optional[list] = None

class LocationUpdateIn(Schema):
    location: Optional[str] = None
    detail_location: Optional[str] = None
    memo: Optional[str] = None
    images: Optional[List[str]] = None