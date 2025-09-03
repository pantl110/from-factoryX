from ninja import Schema, ModelSchema
from typing import Optional, List
import datetime
from stock.models import Product
from pydantic import field_validator
from decimal import Decimal


# Material Product Info
class MaterialProductConnectionOut(Schema):
    id: int
    product_id: int
    material_id: int
    quantity: float
    product_name: str
    material_name: str


# ------------------------------------------------------------
# Product API
# ------------------------------------------------------------


# (POST) Create Single Product
class SingleProductCreateOut(Schema):
    factory_id: int
    product_id: int


# (POST) Create Product
class ProductListOut(Schema):
    id: int
    factory: int
    name: str
    code: str
    unit: str
    spec: str
    current_stock: Optional[int]


# (GET) List Product
class ProductOut(Schema):
    id: int
    factory: int
    name: str
    code: str
    unit: str
    spec: str
    current_stock: Optional[int]
    average_production_time: Optional[int]
    note: Optional[str]


class ProductRowOut(ModelSchema):
    created_at: str | datetime.datetime
    updated_at: str | datetime.datetime
    buffer_rate: Decimal | float

    class Meta:
        model = Product
        fields = "__all__"

    @field_validator("created_at", "updated_at", mode="after", check_fields=False)
    @classmethod
    def convert_dates(cls, value):
        if isinstance(value, datetime.datetime):
            return value.strftime("%Y-%m-%d %H:%M:%S")
        return value

    @field_validator("buffer_rate", mode="after", check_fields=False)
    @classmethod
    def convert_buffer_rate(cls, value):
        if isinstance(value, Decimal):
            return float(value)
        return value


# ------------------------------------------------------------
# Product History API
# ------------------------------------------------------------


# (GET) List Product History
class ProductHistoryOut(Schema):
    id: int
    type: str
    product_id: int
    quantity: int
    total_stock: int
    created_at: datetime.datetime
    updated_at: datetime.datetime


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


# (GET) Material Detail
class MaterialDetailOut(Schema):
    id: int
    name: str
    code: str
    spec: str
    unit: str
    current_stock: int
    standard_stock: int


# (GET) Shortage Material Count
class ShortageMaterialCountOut(Schema):
    shortage_count: int
    total_materials: int
    shortage_percentage: float


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


# (GET) Material History List with Details
class MaterialHistoryItemOut(Schema):
    id: int
    type: str
    material_id: int
    material_name: str
    material_code: str
    client_id: Optional[int]
    client_name: Optional[str]
    quantity: int
    unit_price: Optional[int]
    amount: int
    date: Optional[str]
    total_stock: int
    cash_receipt: Optional[int]
    national_tax_service_id: Optional[int]
