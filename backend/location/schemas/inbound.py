from ninja import Schema
from typing import Optional

class LocationCreateIn(Schema):
    id: int
    type: str
    location: str
    images: Optional[list] = None

class LocationUpdateIn(Schema):
    type: str
    location: str
    images: Optional[list] = None