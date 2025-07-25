from ninja import Schema
from typing import Optional, List

class LocationCreateIn(Schema):
    id: int
    type: str
    location: str
    images: Optional[list] = None

class LocationUpdateIn(Schema):
    type: str
    location_id: int
    location: str
    images: Optional[List[str]] = None