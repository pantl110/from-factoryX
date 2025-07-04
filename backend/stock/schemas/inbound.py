from ninja import ModelSchema, Field
from stock.models import Material, MaterialHistory
from typing import Optional, List
from pydantic import BaseModel


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
