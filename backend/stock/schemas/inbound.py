from ninja import ModelSchema, Field, FilterSchema
from pydantic import BaseModel, conint
from typing import Optional, List, Any
from stock.models import Material, MaterialHistory, Product, ProductHistory
from factory.models import Factory, FactoryEquipment


class MaterialCreateSchema(BaseModel):
    factory_id: int
    name: str
    code: str
    unit: str
    spec: str
    current_stock: Optional[int] = 0
    standard_stock: Optional[int] = 0


class MaterialUpdateSchema(BaseModel):
    name: Optional[str]
    code: Optional[str]
    unit: Optional[str]
    spec: Optional[str]
    current_stock: Optional[int]
    standard_stock: Optional[int]


class MaterialExcelUploadResponseSchema(BaseModel):
    success: bool
    message: str
    data: Optional[List[Any]] = None


class ProductMaterialConnectSchema(BaseModel):
    material_id: int
    quantity: float


class ProductCreateSchema(BaseModel):
    factory_id: int
    name: str
    code: str
    spec: str
    unit: str
    current_stock: Optional[int] = 0
    average_production_time: Optional[int] = None
    location: Optional[str] = None
    note: Optional[str] = None


class ProductUpdateSchema(BaseModel):
    name: Optional[str]
    code: Optional[str]
    spec: Optional[str]
    unit: Optional[str]
    current_stock: Optional[int]
    average_production_time: Optional[int]
    location: Optional[str]
    note: Optional[str]


class ProductExcelUploadResponseSchema(BaseModel):
    success: bool
    message: str
    data: Optional[List[Any]] = None


class ProductFilter(FilterSchema):
    name: Optional[str] = Field(
        default=None, q="name__icontains", description="제품 이름"
    )


# Material Filter Schema
class MaterialFilter(FilterSchema):
    name: Optional[str] = Field(
        default=None, q="name__icontains", description="자재명"
    )
    code: Optional[str] = Field(
        default=None, q="code__icontains", description="자재코드"
    )
    spec: Optional[str] = Field(
        default=None, q="spec__icontains", description="규격"
    )


# Material History Filter Schema
class MaterialHistoryFilter(FilterSchema):
    type: Optional[str] = Field(
        default=None, q="type", description="히스토리 유형 (purchase/consumption)"
    )
    start_date: Optional[str] = Field(
        default=None, q="created_at__date__gte", description="조회 시작일 (YYYY-MM-DD)"
    )
    end_date: Optional[str] = Field(
        default=None, q="created_at__date__lte", description="조회 종료일 (YYYY-MM-DD)"
    )
    client_id: Optional[int] = Field(
        default=None, q="client_id", description="거래처 ID"
    )


class ProductCreateIn(ModelSchema):
    """제품 생성 스키마"""

    factory: int

    class Meta:
        model = Product
        exclude = [
            "id",
            "created_at",
            "updated_at",
        ]


class ProductUpdateIn(ModelSchema):
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
    location: Optional[str] = Field(default=None, description="위치")
    note: Optional[str] = Field(default=None, description="특이사항")

    class Meta:
        model = Product
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


class MaterialCreateIn(ModelSchema):
    factory_id: int = Field(description="공장 ID")
    
    class Meta:
        model = Material
        exclude = [
            "id",
            "factory",
            "created_at",
            "updated_at",
            "current_stock",
            # "products",
        ]

    def validate_code(self, value):
        if not value:
            raise ValueError("자재코드는 필수입니다.")
        return value

    def validate_name(self, value):
        if not value:
            raise ValueError("자재명은 필수입니다.")
        if len(value) > 100:
            raise ValueError("자재명은 100자를 초과할 수 없습니다.")
        return value


class MaterialUpdateIn(ModelSchema):
    material_id: int = Field(description="원자재 ID")
    factory_id: int = Field(description="공장 ID")
    name: Optional[str] = Field(default=None, description="자재명")
    code: Optional[str] = Field(default=None, description="자재코드")
    unit: Optional[str] = Field(default=None, description="단위")
    spec: Optional[str] = Field(default=None, description="규격")
    standard_stock: Optional[int] = Field(default=None, description="안전 재고")

    class Meta:
        model = Material
        exclude = [
            "id",
            "factory",
            "created_at",
            "updated_at",
            "current_stock",
            # "products",
        ]


class MaterialHistoryCreateIn(ModelSchema):
    material_id: int = Field(description="원자재 ID")
    client_id: int = Field(description="거래처 ID")
    factory_id: int = Field(description="공장 ID")
    quantity: conint(gt=0) = Field(description="재고 변동 수량(1 이상)")
    price: Optional[conint(ge=0)] = Field(default=None, description="구매 단가(0 이상)")
    
    class Meta:
        model = MaterialHistory
        exclude = [
            "id",
            "material",
            "client",
            "created_at",
            "updated_at",
            "total_stock",
        ]


class MaterialHistoryUpdateIn(ModelSchema):
    history_id: int = Field(description="히스토리 ID")
    quantity: Optional[conint(gt=0)] = Field(default=None, description="재고 변동 수량(1 이상)")
    price: Optional[conint(ge=0)] = Field(default=None, description="구매 단가(0 이상)")
    
    class Meta:
        model = MaterialHistory
        exclude = [
            "id",
            "material",
            "client",
            "type",
            "created_at",
            "updated_at",
            "total_stock",
        ]


class MaterialBulkCreateIn(BaseModel):
    factory_id: int = Field(description="공장 ID")
    materials: List[MaterialCreateIn]


class MaterialHistoryDetailIn(BaseModel):
    history_id: int

class MaterialHistoryRecentIn(BaseModel):
    material_id: int
    factory_id: int
    months: Optional[int] = 3

class MaterialHistoryDeleteIn(BaseModel):
    history_id: int


class MaterialSearchIn(BaseModel):
    factory_id: int = Field(description="공장 ID")
    q: Optional[str] = Field(default="", description="검색어")


class MaterialDetailIn(BaseModel):
    factory_id: int = Field(description="공장 ID")
    material_id: int = Field(description="원자재 ID")


class MaterialDeleteIn(BaseModel):
    factory_id: int = Field(description="공장 ID")
    material_id: int = Field(description="원자재 ID")
