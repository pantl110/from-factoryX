from sys import int_info
from ninja import ModelSchema, Field, FilterSchema, Schema
from pydantic import BaseModel
from typing import Optional, List, Any
from stock.models import Product, ProductHistory, Material


class ProductMaterialConnectIn(Schema):
    material_id: int
    quantity: float


class ProductExcelUploadResponseIn(Schema):
    success: bool
    message: str
    data: Optional[List[Any]] = None


class ProductFilter(FilterSchema):
    name: Optional[str] = Field(
        default=None, q="name__icontains", description="제품 이름"
    )
    code: Optional[str] = Field(
        default=None, q="code__icontains", description="제품 코드"
    )

# (POST) Create Product History
class ProductCreateIn(Schema):
    name: str
    code: str
    unit: str
    spec: str
    current_stock: Optional[int]
    average_production_time: Optional[int]
    buffer_rate: Optional[float]
    note: Optional[str]


class ProductUpdateIn(Schema):
    """제품 수정 스키마"""

    factory: Optional[int] = Field(default=None, description="공장 ID")
    name: Optional[str] = Field(default=None, description="제품명")
    code: Optional[str] = Field(default=None, description="제품코드")
    unit: Optional[str] = Field(default=None, description="단위")
    spec: Optional[str] = Field(default=None, description="규격")
    current_stock: Optional[int] = Field(default=None, description="현재 재고")
    average_production_time: Optional[int] = Field(
        default=None, description="평균 생산 시간(초)"
    )
    buffer_rate: Optional[float] = Field(default=None, description="버퍼율")
    note: Optional[str] = Field(default=None, description="특이사항")


class FactoryClientCreateIn(Schema):
    name: str = Field(..., description="업체명")
    business_registration_number: Optional[str] = Field(
        default=None, description="사업자등록번호"
    )
    representative_name: Optional[str] = Field(default=None, description="대표자명")
    business_type: Optional[str] = Field(default=None, description="업태")
    business_category: Optional[str] = Field(default=None, description="종목")
    address: Optional[str] = Field(default=None, description="사업장 주소")


class MaterialProductConnectionIn(Schema):
    """MaterialProduct 연결 정보"""

    id: int = Field(
        ...,
        description="연결할 ID (type이 material이면 Product ID, type이 product이면 Material ID)",
    )
    quantity: float = Field(..., description="제품 1개 생산에 필요한 원자재 수량")


class ProductHistoryCreateIn(ModelSchema):
    """제품 입출고 이력 생성 입력 스키마"""

    product: int = Field(..., description="제품 ID")

    class Meta:
        model = ProductHistory
        exclude = [
            "id",
            "created_at",
            "updated_at",
        ]


class ProductHistoryFilter(FilterSchema):
    start_date: Optional[str] = Field(
        default=None, q="created_at__date__gte", description="조회 시작일 (YYYY-MM-DD)"
    )
    end_date: Optional[str] = Field(
        default=None, q="created_at__date__lte", description="조회 종료일 (YYYY-MM-DD)"
    )
    product_id: Optional[int] = Field(
        default=None, q="product_id", description="품목 ID"
    )


# Onboarding Tab
# create_single_product
class SingleProductCreateIn(Schema):
    """단일 품목 생성 스키마"""
    factory_id: int = Field(..., description="공장 ID")
    name: str = Field(..., description="품목명")
    code: str = Field(..., description="품목 코드")
    spec: str = Field(..., description="규격")
    unit: str = Field(..., description="단위")


# Onboarding Tab
# assign_materialproduct
class MaterialAssignmentIn(Schema):
    """원자재 할당 입력 스키마"""
    name: str = Field(..., description="자재명")
    code: str = Field(..., description="자재 코드")
    spec: str = Field(..., description="규격")
    quantity: float = Field(..., description="사용 수량")


# Onboarding Tab
class ProductAssignmentIn(Schema):
    name: str = Field(..., description="품목명")
    code: str = Field(..., description="품목코드")
    spec: str = Field(..., description="규격")
    unit: str = Field(..., description="단위")
    quantity: float = Field(..., description="제품 1개 생산에 필요한 원자재 수량")

class AssignProductIn(Schema):
    factory_id: int = Field(..., description="공장 ID")
    material_id: int = Field(..., description="원자재 ID")
    products: List[ProductAssignmentIn] = Field(..., description="연결할 품목 목록")


# ------------------------------------------------------------
# Material API
# ------------------------------------------------------------

# (POST) Assign Material
class AssignMaterialIn(Schema):
    product_id: int
    materials: List[MaterialAssignmentIn]


# (PATCH) Update Material
class MaterialUpdateIn(Schema):
    name: Optional[str] = Field(default=None)
    code: Optional[str] = Field(default=None)
    spec: Optional[str] = Field(default=None)
    unit: Optional[str] = Field(default=None)
    current_stock: Optional[int] = Field(default=None)
    standard_stock: Optional[int] = Field(default=None)


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
class FactoryClientCreateIn(BaseModel):
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
