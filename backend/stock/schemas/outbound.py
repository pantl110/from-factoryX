from ninja import Schema, ModelSchema, Field
from typing import Optional, List
import datetime
from stock.models import Product, Material
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
    product_id: int
    project_id: Optional[int] = None
    client_name: Optional[str] = None
    production_quantity: Optional[int] = None
    delivery_quantity: Optional[int] = None
    quantity: Optional[int] = None
    total_stock: Optional[int] = None
    is_canceled: bool
    has_more_history: Optional[bool] = None
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
    current_stock: Optional[int]
    status: Optional[str] = Field(None, description="자재 상태: '과재고', '충분', '위험', '부족', None")


# (GET) Expiry Risk Materials
class ExpiryRiskMaterialOut(Schema):
    id: int
    name: str
    unit: str
    current_stock: Optional[int]
    rop: Optional[int]
    expiry_status: str = Field(description="유통기한 상태: '위험'")


# (GET) Material Detail
class MaterialDetailModelOut(ModelSchema):
    expiry_status: Optional[str] = Field(None, description="유통기한 상태: '양호', '위험', None")
    
    class Meta:
        model = Material
        fields = [
            "id",
            "name",
            "code",
            "spec",
            "unit",
            "current_stock",
            "standard_stock",
            "rop",
            "max_stock",
            "expiry_days",
            "memo",
        ]


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
    lot_number: Optional[str] = None
    warehouse_location: Optional[str] = None
    expiration_date: Optional[str] = None
    total_stock: int
    remaining_quantity: Optional[int] = None


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
    material_spec: str
    material_unit: str
    client_id: Optional[int]
    client_name: Optional[str]
    quantity: int
    unit_price: Optional[int]
    amount: int
    date: Optional[str]
    total_stock: int
    cash_receipt: Optional[int]
    national_tax_service_id: Optional[int]
    lot_number: Optional[str] = None
    warehouse_location: Optional[str] = None
    expiration_date: Optional[str] = None
    remaining_quantity: Optional[int] = None
    next_repackaging_lot_number: Optional[str] = Field(
        None, description="소분 시 생성될 다음 로트 번호 (구매 타입이고 잔량이 있을 때만)"
    )


class MaterialAvailableLotOut(Schema):
    source: str = Field(..., description="로트 출처: 'history' 또는 'repackaging'")
    id: int = Field(..., description="source에 따른 PK (MaterialHistory.id 또는 MaterialRepackaging.id)")
    lot_number: str = Field(..., description="로트 번호")
    available_quantity: int = Field(..., description="사용 가능한 수량")
    warehouse_location: Optional[str] = Field(None, description="창고 위치")
    expiration_date: Optional[str] = Field(None, description="유통기한 (YYYY-MM-DD)")


# ------------------------------------------------------------
# Material Usage API
# ------------------------------------------------------------


class MaterialUsageOut(Schema):
    id: int
    plan_id: int
    original_material_id: Optional[int] = None
    original_material_name: Optional[str] = None
    material_id: int
    material_name: str
    material_unit: str
    usage_amount: Decimal
    material_history_id: Optional[int] = None
    material_history_lot_number: Optional[str] = None
    material_repackaging_id: Optional[int] = None
    material_repackaging_lot_number: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
