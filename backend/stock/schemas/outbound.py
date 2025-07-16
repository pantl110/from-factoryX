from ninja import ModelSchema, Schema
from pydantic import BaseModel
<<<<<<< HEAD
from ninja import ModelSchema
=======
>>>>>>> fb70c120b1ed6d3b6149272fc7561cd66c18b44d
from stock.models import Product, ProductHistory, Material, MaterialHistory, MaterialProduct
from typing import Optional, List


class MaterialHistoryOut(ModelSchema):
    class Meta:
        model = MaterialHistory
        fields = "__all__"


<<<<<<< HEAD
class MaterialHistoryDetailOut(BaseModel):
=======
class MaterialHistoryDetailOut(Schema):
>>>>>>> fb70c120b1ed6d3b6149272fc7561cd66c18b44d
    id: int
    type: str
    material_id: int
    client_id: int
    quantity: int
    price: Optional[int]
    total_stock: int


<<<<<<< HEAD
class MaterialHistoryListOut(BaseModel):
    materials: List[MaterialHistoryDetailOut]


class MaterialListOut(BaseModel):
    materials: List[dict]


class MaterialSummaryOut(BaseModel):
=======
class MaterialHistoryListOut(Schema):
    materials: List[MaterialHistoryDetailOut]


class MaterialListOut(Schema):
    materials: List[dict]


class MaterialSummaryOut(Schema):
>>>>>>> fb70c120b1ed6d3b6149272fc7561cd66c18b44d
    id: int
    name: str
    code: str
    spec: str
    unit: str
    current_stock: int


<<<<<<< HEAD
class MaterialDetailOut(BaseModel):
=======
class MaterialDetailOut(Schema):
>>>>>>> fb70c120b1ed6d3b6149272fc7561cd66c18b44d
    id: int
    name: str
    code: str
    spec: str
    unit: str
    current_stock: int
    standard_stock: int


<<<<<<< HEAD
class ProductListResponseSchema(BaseModel):
=======
class ProductListResponseOut(Schema):
>>>>>>> fb70c120b1ed6d3b6149272fc7561cd66c18b44d
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


<<<<<<< HEAD
class MaterialProductConnectionOut(BaseModel):
=======
class MaterialProductConnectionOut(Schema):
>>>>>>> fb70c120b1ed6d3b6149272fc7561cd66c18b44d
    """MaterialProduct 연결 응답 스키마"""
    id: int
    product_id: int
    material_id: int
    quantity: float
    product_name: str
    material_name: str


<<<<<<< HEAD
class MaterialProductConnectOut(BaseModel):
=======
class MaterialProductConnectOut(Schema):
>>>>>>> fb70c120b1ed6d3b6149272fc7561cd66c18b44d
    """MaterialProduct 연결 생성 응답 스키마"""
    message: str
    created_connections: List[MaterialProductConnectionOut]
    total_count: int
