from ninja import ModelSchema, Schema, Field
from pydantic import BaseModel
from stock.models import Product, ProductHistory, Material, MaterialHistory, MaterialProduct
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


# Onboarding Tab
# create_single_product
class SingleProductCreateOut(Schema):
    """단일 품목 생성 응답 스키마"""
    factory_id: int = Field(..., description="공장 ID")
    product_id: int = Field(..., description="생성된 품목 ID")


# Onboarding Tab
# assign_materialproduct
class MaterialProductConnectionOut(Schema):
    """MaterialProduct 연결 응답 스키마"""
    id: int = Field(..., description="연결 ID")
    product_id: int = Field(..., description="제품 ID")
    material_id: int = Field(..., description="원자재 ID")
    quantity: float = Field(..., description="제품 1개 생산에 필요한 원자재 수량")
    product_name: str = Field(..., description="제품명")
    material_name: str = Field(..., description="원자재명")


# Onboarding Tab
# assign_materialproduct
class MaterialProductConnectOut(Schema):
    """MaterialProduct 연결 생성 응답 스키마"""
    message: str = Field(..., description="처리 결과 메시지")
    created_connections: List[MaterialProductConnectionOut] = Field(..., description="생성된 연결 목록")
    total_count: int = Field(..., description="총 연결 개수")