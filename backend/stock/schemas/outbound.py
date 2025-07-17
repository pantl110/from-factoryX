from ninja import ModelSchema, Schema
from pydantic import BaseModel
from stock.models import (
    Product,
    ProductHistory,
    Material,
    MaterialHistory,
    MaterialProduct,
)
from typing import Optional, List


class MaterialHistoryOut(ModelSchema):
    class Meta:
        model = MaterialHistory
        fields = "__all__"


class MaterialHistoryDetailOut(Schema):
    id: int
    type: str
    material_id: int
    client_id: int
    quantity: int
    price: Optional[int]
    total_stock: int


class MaterialHistoryListOut(Schema):
    materials: List[MaterialHistoryDetailOut]


class MaterialListOut(Schema):
    materials: List[dict]


class MaterialSummaryOut(Schema):
    id: int
    name: str
    code: str
    spec: str
    unit: str
    current_stock: int


class MaterialDetailOut(Schema):
    id: int
    name: str
    code: str
    spec: str
    unit: str
    current_stock: int
    standard_stock: int


class ProductListResponseOut(Schema):
    # products: List[ProductResponseSchema]
    total_count: int


class ProductHistorySchemaOut(Schema):
    처리일자: str
    상태: str
    수량: int
    현재재고: int


class ProductionTimeOut(Schema):
    품목명: str
    평균생산시간_초: int
    평균생산시간_분: float


class ProductOut(Schema):
    id: int
    factory: int
    name: str
    code: str
    unit: str
    spec: str
    current_stock: int
    average_production_time: Optional[int]
    buffer_rate: float
    note: Optional[str]
    created_at: str
    updated_at: str


class ProductHistoryOut(ModelSchema):
    class Meta:
        model = ProductHistory
        fields = "__all__"


class MaterialProductConnectionOut(Schema):
    """MaterialProduct 연결 응답 스키마"""

    id: int
    product_id: int
    material_id: int
    quantity: float
    product_name: str
    material_name: str


class MaterialProductConnectOut(Schema):
    """MaterialProduct 연결 생성 응답 스키마"""

    message: str
    created_connections: List[MaterialProductConnectionOut]
    total_count: int
