from ninja import ModelSchema, Field, FilterSchema
from pydantic import BaseModel
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
    average_production_time: Optional[int] = Field(default=None, description="평균 생산 시간(초)")
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
    class Meta:
        model = Material
        exclude = [
            "id",
            "factory",
            "created_at",
            "updated_at",
            "current_stock",
            "products",
        ]


class MaterialUpdateIn(ModelSchema):
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
            "products",
        ]


class MaterialHistoryCreateIn(ModelSchema):
    client_id: int = Field(description="거래처 ID")
    
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
    quantity: Optional[int] = Field(default=None, description="재고 변동 수량")
    price: Optional[int] = Field(default=None, description="구매 단가")

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
    materials: List[MaterialCreateIn]
