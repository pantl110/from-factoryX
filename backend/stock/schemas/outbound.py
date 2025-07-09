from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ninja import ModelSchema, Field
from stock.models import Product, ProductHistory, Material, MaterialHistory
from factory.models import FactoryClient


class MaterialOut(ModelSchema):
    """원자재 출력 스키마 - 기본 정보"""
    class Meta:
        model = Material
        fields = "__all__"


class MaterialDetailOut(ModelSchema):
    """원자재 출력 스키마 - 상세 정보 (업체별 단가 비교 포함)"""
    client_stats: Optional[Dict[str, Any]] = Field(default=None, description="업체별 통계")
    location_name: Optional[str] = Field(default=None, description="위치명")
    created_at_formatted: Optional[str] = Field(default=None, description="등록일시")
    updated_at_formatted: Optional[str] = Field(default=None, description="수정일시")
    
    class Meta:
        model = Material
        fields = "__all__"


class MaterialHistoryOut(ModelSchema):
    """원자재 히스토리 출력 스키마 - 기본 정보"""
    class Meta:
        model = MaterialHistory
        fields = "__all__"


class MaterialHistoryDetailOut(ModelSchema):
    """원자재 히스토리 출력 스키마 - 상세 정보"""
    client_name: Optional[str] = Field(default=None, description="거래처명")
    material_name: Optional[str] = Field(default=None, description="원자재명")
    material_code: Optional[str] = Field(default=None, description="원자재코드")
    created_at_formatted: Optional[str] = Field(default=None, description="처리일시")
    
    class Meta:
        model = MaterialHistory
        fields = "__all__"


class ProductListResponseSchema(BaseModel):
    # products: List[ProductResponseSchema]
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
