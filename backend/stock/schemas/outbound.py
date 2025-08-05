from ninja import Schema
from typing import Optional, List
import datetime


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