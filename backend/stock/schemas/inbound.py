from ninja import Field, FilterSchema, Schema
from typing import Optional, List


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
    name: str
    code: str
    unit: str
    spec: str
    current_stock: Optional[int]
    average_production_time: Optional[int]
    buffer_rate: Optional[float]
    note: Optional[str]


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
