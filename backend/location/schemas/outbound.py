from ninja import Schema
from typing import List

class LocationListOut(Schema):
    id: int
    type: str
    location: str
    images: list

class LocationDetailOut(Schema):
    id: int
    type: str
    location: str
    images: List[str] = []

class ItemLocationsListOut(Schema):
    locations: List[LocationDetailOut]