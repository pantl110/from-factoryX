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

class ProductMaterialRelationSchema(BaseModel):
    id: int
    material_id: int
    material_name: str
    quantity: float

class ProductMaterialRelationListSchema(BaseModel):
    relations: List[ProductMaterialRelationSchema]
    total_count: int

class ProductSimpleSchema(BaseModel):
    id: int
    name: str
    code: str
    spec: str
    unit: str
    current_stock: int