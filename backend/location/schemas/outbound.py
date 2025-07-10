from ninja import Schema

class LocationListOut(Schema):
    id: int
    type: str
    location: str
    images: list

class ErrorOut(Schema):
    detail: str