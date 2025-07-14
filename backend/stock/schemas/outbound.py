from pydantic import BaseModel
from ninja import ModelSchema
from stock.models import Product, ProductHistory, Material, MaterialHistory
from typing import Optional, List


class MaterialHistoryOut(ModelSchema):
    class Meta:
        model = MaterialHistory
        fields = "__all__"


class MaterialHistoryDetailOut(BaseModel):
    id: int
    type: str
    material_id: int
    client_id: int
    quantity: int
    price: Optional[int]
    total_stock: int


class MaterialHistoryListOut(BaseModel):
    materials: List[MaterialHistoryDetailOut]


class MaterialListOut(BaseModel):
    materials: List[dict]


class MaterialSummaryOut(BaseModel):
    id: int
    name: str
    code: str
    spec: str
    unit: str
    current_stock: int


class MaterialDetailOut(BaseModel):
    """원자재 상세 정보 출력 스키마"""
    id: int
    name: str
    code: str
    spec: str
    unit: str
    current_stock: int
    standard_stock: int


class ProductListResponseSchema(BaseModel):
    # products: List[ProductResponseSchema]
    total_count: int


class ProductHistorySchema(BaseModel):
    처리일자: str
    상태: str
    수량: int
    현재재고: int


class ProductionTimeSchema(BaseModel):
    품목명: str
    평균생산시간_초: int
    평균생산시간_분: float


class ProductOut(ModelSchema):
    class Meta:
        model = Product
        fields = "__all__"


class ProductHistoryOut(ModelSchema):
    class Meta:
        model = ProductHistory
        fields = "__all__"
