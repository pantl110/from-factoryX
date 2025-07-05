from pydantic import BaseModel
from typing import Optional, List, Any
from stock.models import Product
from ninja import ModelSchema, Field
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

class ProductCreateIn(ModelSchema):
    # accept factory primary key directly
    factory: int
    class Meta:
        model = Product
        exclude = [
            "id",
            "created_at",
            "updated_at",
        ]

class ProductUpdateIn(ModelSchema):
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