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

class ProductResponseSchema(BaseModel):
    id: int
    factory_id: int
    name: str
    code: str
    spec: str
    unit: str
    current_stock: int
    average_production_time: Optional[int]
    location: Optional[str]
    note: Optional[str]

class ProductListResponseSchema(BaseModel):
    products: List[ProductResponseSchema]
    total_count: int

class MaterialClientInfoSchema(BaseModel):
    거래처명: str
    거래일자: str
    수량: int
    단가: int
    금액: int
    거래유형: str

class MaterialHistorySchema(BaseModel):
    처리일자: str
    상태: str
    수량: int
    현재재고: int
    거래처: str
    단가: int

class ProductHistorySchema(BaseModel):
    처리일자: str
    상태: str
    수량: int
    현재재고: int

class ProductionTimeSchema(BaseModel):
    품목명: str
    평균생산시간_초: int
    평균생산시간_분: float