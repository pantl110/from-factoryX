from ninja import Schema
from typing import Optional, List

class LocationCreateIn(Schema):
    id: int
    type: str
    location: str
    images: Optional[list] = None

class LocationUpdateIn(Schema):
    location: Optional[str] = None
    images: Optional[List[str]] = None