from ninja import ModelSchema, Field, FilterSchema, Schema
from factory.models import Factory, FactoryEquipment, FactoryClient
from typing import Optional


class FactoryCreateIn(ModelSchema):
    class Meta:
        model = Factory
        exclude = [
            "id",
            "owner",
            "created_at",
            "updated_at",
        ]


class FactoryUpdateIn(ModelSchema):
    factory_id: int = Field(description="공장 ID")
    name: Optional[str] = Field(default=None, description="공장 이름")

    class Meta:
        model = Factory
        exclude = [
            "id",
            "owner",
            "created_at",
            "updated_at",
        ]


class FactoryFilter(FilterSchema):
    name: Optional[str] = Field(default=None, q="name__icontains", description="공장명")
    address: Optional[str] = Field(default=None, q="address__icontains", description="공장 주소")


class FactoryDetailIn(Schema):
    factory_id: int


class FactoryDeleteIn(Schema):
    factory_id: int


class FactoryEqCreateIn(ModelSchema):
    # accept factory PK directly
    factory: int

    class Meta:
        model = FactoryEquipment
        exclude = [
            "id",
            "created_at",
            "updated_at",
        ]


# Factory Equipment Filter Schema
class FactoryEqFilter(FilterSchema):
    name: Optional[str] = Field(default=None, q="name__icontains", description="설비명")
    status: Optional[str] = Field(default=None, q="status", description="설비 상태")
    location: Optional[str] = Field(default=None, q="location__icontains", description="설비 위치")
    priority: Optional[int] = Field(default=None, q="priority", description="우선순위")


# 거래처 관련 스키마
class FactoryClientCreateIn(ModelSchema):
    factory_id: int = Field(description="공장 ID")
    
    class Meta:
        model = FactoryClient
        exclude = [
            "id",
            "factory",
            "created_at",
            "updated_at",
        ]


class FactoryEqUpdateIn(ModelSchema):
    name: Optional[str] = Field(default=None, description="공장 설비 이름")
    factory: Optional[int] = Field(default=None, description="공장 ID")
    priority: Optional[int] = Field(default=None, description="우선순위")
    note: Optional[str] = Field(default=None, description="설비 설명")
    status: Optional[str] = Field(default=None, description="설비 상태")
    location: Optional[str] = Field(default=None, description="설비 위치")
    
    class Meta:
        model = FactoryEquipment
        exclude = [
            "id",
            "factory",
            "created_at",
            "updated_at",
        ]


# 거래처 관련 스키마
class FactoryClientUpdateIn(ModelSchema):
    client_id: int = Field(description="거래처 ID")
    factory_id: int = Field(description="공장 ID")
    
    class Meta:
        model = FactoryClient
        exclude = [
            "id",
            "factory",
            "created_at",
            "updated_at",
        ]


# Factory Client Filter Schema
class FactoryClientFilter(FilterSchema):
    name: Optional[str] = Field(
        default=None, q="name__icontains", description="거래처명"
    )
    business_registration_number: Optional[str] = Field(
        default=None, q="business_registration_number__icontains", description="사업자등록번호"
    )
    representative_name: Optional[str] = Field(
        default=None, q="representative_name__icontains", description="대표자명"
    )
    client_type: Optional[str] = Field(
        default=None, q="client_type", description="거래처 유형 (customer/supplier)"
    )

# 거래처 상세 조회용 스키마
class FactoryClientDetailIn(Schema):
    factory_id: int
    client_id: int

# 거래처 삭제용 스키마
class FactoryClientDeleteIn(Schema):
    factory_id: int
    client_id: int

# 거래처 검색용 스키마
class FactoryClientSearchIn(Schema):
    factory_id: int
    q: Optional[str] = ""
