from pydantic import BaseModel
from typing import Optional, List

class MaterialResponseSchema(BaseModel):
    id: int
    factory_id: int
    name: str
    code: str
    unit: str
    spec: str
    current_stock: int
    standard_stock: int

class MaterialListResponseSchema(BaseModel):
    materials: List[MaterialResponseSchema]
    total_count: int

class MaterialSimpleSchema(BaseModel):
    id: int
    name: str
    code: str