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


class ProductCreateIn(Schema):
    """제품 생성 스키마"""

    factory: int = Field(..., description="공장 ID")
    name: str = Field(..., description="제품명")
    code: str = Field(..., description="제품코드")
    unit: str = Field(..., description="단위")
    spec: str = Field(..., description="규격")
    current_stock: Optional[int] = Field(default=None, description="현재 재고")
    average_production_time: Optional[int] = Field(
        default=None, description="평균 생산 시간(초)"
    )
    buffer_rate: Optional[float] = Field(default=0.10, description="버퍼율")
    note: Optional[str] = Field(default=None, description="특이사항")


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


class MaterialItemIn(Schema):
    name: str = Field(..., description="자재명")
    code: str = Field(..., description="자재코드")
    spec: str = Field(..., description="규격")
    unit: str = Field(..., description="단위")
    quantity: int = Field(..., description="재고 변동 수량")
    price: int = Field(..., description="구매 단가")


class MaterialHistoryCreateIn(Schema):
    factory: int = Field(..., description="공장 ID")
    client_info: FactoryClientCreateIn = Field(..., description="거래처 정보")
    materials: List[MaterialItemIn] = Field(..., description="원자재 목록")


class MaterialUpdateIn(Schema):
    """원자재 수정 입력 스키마"""

    name: Optional[str] = Field(default=None, description="자재명")
    code: Optional[str] = Field(default=None, description="자재코드")
    spec: Optional[str] = Field(default=None, description="규격")
    unit: Optional[str] = Field(default=None, description="단위")
    current_stock: Optional[int] = Field(default=None, description="현재 재고")
    standard_stock: Optional[int] = Field(default=None, description="안전 재고")


class FactoryClientCreateIn(BaseModel):
    name: str = Field(..., description="업체명")
    business_registration_number: Optional[str] = Field(
        default=None, description="사업자등록번호"
    )
    representative_name: Optional[str] = Field(default=None, description="대표자명")
    business_type: Optional[str] = Field(default=None, description="업태")
    business_category: Optional[str] = Field(default=None, description="종목")
    address: Optional[str] = Field(default=None, description="사업장 주소")


class SingleMaterialHistoryCreateIn(Schema):
    """단일 원자재 히스토리 생성 입력 스키마"""

    material_id: int = Field(..., description="원자재 ID")
    type: str = Field(..., description="거래 타입 (purchase: 구매, consumption: 소모)")
    quantity: int = Field(..., description="재고 변동 수량")
    price: Optional[int] = Field(
        default=None, description="구매 단가 (구매 시에만 입력)"
    )
    client_id: int = Field(..., description="거래처 ID")


class MaterialProductConnectionIn(Schema):
    """MaterialProduct 연결 정보"""

    id: int = Field(
        ...,
        description="연결할 ID (type이 material이면 Product ID, type이 product이면 Material ID)",
    )
    quantity: float = Field(..., description="제품 1개 생산에 필요한 원자재 수량")


class MaterialProductConnectIn(Schema):
    """MaterialProduct 연결 생성 입력 스키마"""

    type: str = Field(
        ..., description="연결 타입 (material: 원자재 기준, product: 제품 기준)"
    )
    target_id: int = Field(
        ...,
        description="기준이 되는 ID (type이 material이면 Material ID, type이 product이면 Product ID)",
    )
    connections: List[MaterialProductConnectionIn] = Field(
        ..., description="연결할 항목들"
    )


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


class MaterialProductUpdateIn(Schema):
    quantity: float


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
class AssignMaterialIn(Schema):
    """원자재 생성 및 품목 연결 입력 스키마"""
    factory_id: int = Field(..., description="공장 ID")
    product_id: int = Field(..., description="품목 ID")
    materials: List[MaterialAssignmentIn] = Field(..., description="원자재 목록")


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