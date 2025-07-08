from pydantic import BaseModel
from typing import Optional, List
from ninja import ModelSchema
from stock.models import Product, ProductHistory, Material, MaterialHistory
from factory.models import FactoryClient


class MaterialOut(ModelSchema):
    class Meta:
        model = Material
        exclude = ["products"]


class MaterialHistoryOut(ModelSchema):
    class Meta:
        model = MaterialHistory
        fields = "__all__"


class MaterialDetailOut(ModelSchema):
    class Meta:
        model = Material
        exclude = ["products"]


class ProductListResponseSchema(BaseModel):
    products: List[ProductResponseSchema]
    total_count: int

class MaterialClientInfoSchema(BaseModel):
    거래처명: str
    거래일자: str
    수량: int
    단가: int
    금액: int
    거래유형: str

class MaterialHistorySchema(BaseModel):
    처리일자: str
    상태: str
    수량: int
    현재재고: int
    거래처: str
    단가: int

class ProductHistorySchema(BaseModel):
    처리일자: str
    상태: str
    수량: int
    현재재고: int

class ProductionTimeSchema(BaseModel):
    품목명: str
    평균생산시간_초: int
    평균생산시간_분: float

class ProductOut(ModelSchema):
    class Meta:
        model = Product
        fields = "__all__"


class ProductHistoryOut(ModelSchema):
    class Meta:
        model = ProductHistory
        fields = "__all__"
class MaterialHistoryDetailOut(ModelSchema):
    client_name: str = ""
    
    class Meta:
        model = MaterialHistory
        fields = "__all__"
