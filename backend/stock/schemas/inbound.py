from ninja import Field, FilterSchema, Schema
from typing import Optional, List

from pydantic_core.core_schema import str_schema


# Product Info
class ProductAssignmentIn(Schema):
    name: str
    code: str
    spec: str
    unit: str
    quantity: float


# Material Info
class MaterialAssignmentIn(Schema):
    name: str
    code: str
    spec: str
    quantity: float


# Material Product Info
class MaterialProductConnectionIn(Schema):
    id: int
    quantity: float


# ------------------------------------------------------------
# Product API
# ------------------------------------------------------------


# (POST) Create Single Product
class SingleProductCreateIn(Schema):
    factory_id: int
    name: str
    code: str
    spec: str
    unit: str


# (POST) Create Product History
class ProductCreateIn(Schema):
    name: str = Field(..., description="제품명")
    code: str = Field(..., description="제품 코드")
    unit: str = Field(..., description="제품 단위")
    spec: str = Field(..., description="제품 사양")
    current_stock: Optional[int] = Field(None, description="현재 재고")
    average_production_time: Optional[int] = Field(None, description="평균 생산 시간")
    buffer_rate: Optional[float] = Field(None, description="버퍼 비율")
    note: Optional[str] = Field(None, description="비고")


# (POST) Assign Product
class AssignProductIn(Schema):
    factory_id: int
    material_id: int
    products: List[ProductAssignmentIn]


# (GET) List Product
class ProductFilter(FilterSchema):
    name: Optional[str] = Field(default=None, q="name__icontains")
    code: Optional[str] = Field(default=None, q="code__icontains")


# (PATCH) Update Product
class ProductUpdateIn(Schema):
    factory: Optional[int] = None
    name: Optional[str] = None
    code: Optional[str] = None
    unit: Optional[str] = None
    spec: Optional[str] = None
    current_stock: Optional[int] = None
    average_production_time: Optional[int] = None
    buffer_rate: Optional[float] = None
    note: Optional[str] = None


# ------------------------------------------------------------
# Product History API
# ------------------------------------------------------------


# (POST) Create Product History
class ProductHistoryCreateIn(Schema):
    product: int
    type: str
    quantity: int
    total_stock: int


# (GET) List Product History
class ProductHistoryFilter(FilterSchema):
    start_date: Optional[str] = Field(default=None, q="created_at__date__gte")
    end_date: Optional[str] = Field(default=None, q="created_at__date__lte")
    product_id: Optional[int] = Field(default=None, q="product_id")


# ------------------------------------------------------------
# Material API
# ------------------------------------------------------------


# (POST) Create Single Material
class SingleMaterialCreateIn(Schema):
    name: str = Field(..., description="원자재명")
    code: str = Field(..., description="원자재 코드")
    spec: str = Field(..., description="원자재 사양")
    unit: Optional[str] = Field(None, description="원자재 단위")
    current_stock: Optional[int] = Field(None, description="현재 재고")
    standard_stock: Optional[int] = Field(None, description="기준 재고")


# (POST) Assign Material
class AssignMaterialIn(Schema):
    product_id: int
    materials: List[MaterialAssignmentIn]


# (PATCH) Update Material
class MaterialUpdateIn(Schema):
    name: Optional[str] = None
    code: Optional[str] = None
    spec: Optional[str] = None
    unit: Optional[str] = None
    current_stock: Optional[int] = None
    standard_stock: Optional[int] = None


# ------------------------------------------------------------
# Material Product API
# ------------------------------------------------------------


# (POST) Create Material Product Connection
class MaterialProductConnectIn(Schema):
    type: str
    target_id: int
    connections: List[MaterialProductConnectionIn]


# (PATCH) Update Material Product Connection
class MaterialProductUpdateIn(Schema):
    quantity: float


# ------------------------------------------------------------
# Material History API
# ------------------------------------------------------------


# Material Item Info
class MaterialItemIn(Schema):
    name: str
    code: str
    spec: str
    unit: str
    quantity: int
    price: int


# Factory Client Info
class FactoryClientCreateIn(Schema):
    name: str
    business_registration_number: Optional[str]
    representative_name: Optional[str]
    business_type: Optional[str]
    business_category: Optional[str]
    address: Optional[str]


# (POST) Create Single Material History
class SingleMaterialHistoryCreateIn(Schema):
    material_id: int
    type: str
    quantity: int
    price: Optional[int]
    client_id: int


# (POST) Create Material History
class MaterialHistoryCreateIn(Schema):
    client_info: FactoryClientCreateIn
    materials: List[MaterialItemIn]


# (GET) Material History
class MaterialHistoryDetailFilter(FilterSchema):
    start_date: Optional[str] = Field(default=None, q="created_at__date__gte")
    end_date: Optional[str] = Field(default=None, q="created_at__date__lte")
    material_id: Optional[int] = Field(default=None, q="material_id")
    material_name: Optional[str] = Field(
        default=None, description="원자재명으로 검색 (부분 일치)"
    )
    type: Optional[str] = Field(
        default=None, description="히스토리 타입 (purchase, consumption)"
    )
    client_id: Optional[int] = Field(default=None, q="client_id")
    is_linked: Optional[bool] = Field(default=None, description="(현금영수증/세금계산서) 모두 미연결 조회하려면 false 전달")
    receipt_id: Optional[int] = Field(default=None, q="cash_receipt_id")
