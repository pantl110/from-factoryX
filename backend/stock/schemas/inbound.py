from pydantic import BaseModel
from typing import Optional, List, Any
from stock.models import Product

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
    class Meta:
        model = Product
        exclude = [
            "id",
            "created_at",
            "updated_at",
        ]
class ProductUpdateIn(ModelSchema):
    name = Optional[str] = Field(default=None, description="제품명")

    class Meta:
        model = Product
        exclude = [
            "id",
            "created_at",
            "updated_at",
        ]

# class ProductCreateSchema(BaseModel):
#     factory_id: int
#     name: str
#     code: str
#     spec: str
#     unit: str
#     current_stock: Optional[int] = 0
#     average_production_time: Optional[int] = None
#     location: Optional[str] = None
#     note: Optional[str] = None

# class ProductUpdateSchema(BaseModel):
#     name: Optional[str]
#     code: Optional[str]
#     spec: Optional[str]
#     unit: Optional[str]
#     current_stock: Optional[int]
#     average_production_time: Optional[int]
#     location: Optional[str]
#     note: Optional[str]

class ProductExcelUploadResponseSchema(BaseModel):
    success: bool
    message: str
    data: Optional[List[Any]] = None