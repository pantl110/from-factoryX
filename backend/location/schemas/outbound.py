from ninja import Schema
from typing import List, Optional
from datetime import datetime

class LocationListOut(Schema):
    id: int
    type: str
    location: str
    email: Optional[str] = None
    role: Optional[str] = None
    detail_location: Optional[str] = None
    memo: Optional[str] = None
    images: list
    created_at: datetime
    updated_at: datetime

class LocationDetailOut(Schema):
    id: int
    type: str
    location: str
    member_id: Optional[int] = None
    detail_location: Optional[str] = None
    memo: Optional[str] = None
    images: List[str] = []
    created_at: datetime
    updated_at: datetime

class ItemLocationsListOut(Schema):
    locations: List[LocationListOut]