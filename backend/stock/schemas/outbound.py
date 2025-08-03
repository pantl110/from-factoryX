from ninja import ModelSchema, Schema, Field
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


class MaterialListOut(Schema):
    materials: List[dict]


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
    note: Optional[str]


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


class ProductListOut(Schema):
    id: int
    factory: int
    name: str
    code: str
    unit: str
    spec: str
    current_stock: int


class MaterialHistoryDetailResponseOut(Schema):
    id: int
    date: str
    type: str
    quantity: int
    total_stock: int
    purchase_tax_invoice_id: Optional[int]
    cash_receipt_id: Optional[int]



# ------------------------------------------------------------
# Material API
# ------------------------------------------------------------

# (POST) Assign Material
class AssignMaterialOut(Schema):
    material_ids: List[int]
    material_codes: List[str]
    message: str


# (GET) Material By Factory
class MaterialSummaryOut(Schema):
    id: int
    name: str
    code: str
    spec: str
    unit: str
    current_stock: int
    standard_stock: int


# ------------------------------------------------------------
# Material Product API
# ------------------------------------------------------------

# (POST) Create Material Product Connection
class MaterialProductConnectOut(Schema):
    message: str
    created_connections: List[MaterialProductConnectionOut]
    total_count: int


# ------------------------------------------------------------
# Material History API
# ------------------------------------------------------------

# (POST) Create Single Material History
class MaterialHistoryDetailOut(Schema):
    id: int
    type: str
    material_id: int
    client_id: int
    quantity: int
    price: Optional[int]
    total_stock: int


# (POST) Create Material History
class MaterialHistoryListOut(Schema):
    materials: List[MaterialHistoryDetailOut]