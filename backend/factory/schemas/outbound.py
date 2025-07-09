from ninja import ModelSchema, Field
from factory.models import Factory, FactoryEquipment, FactoryClient
from typing import Optional


class FactoryOut(ModelSchema):
    class Meta:
        model = Factory
        fields = "__all__"


class FactoryEqOut(ModelSchema):
    class Meta:
        model = FactoryEquipment
        fields = "__all__"


# 거래처 관련 스키마
class FactoryClientOut(ModelSchema):
    """거래처 출력 스키마 - 기본 정보"""
    class Meta:
        model = FactoryClient
        fields = "__all__"


class FactoryClientDetailOut(ModelSchema):
    """거래처 출력 스키마 - 상세 정보"""
    factory_name: Optional[str] = Field(default=None, description="공장명")
    created_at_formatted: Optional[str] = Field(default=None, description="등록일시")
    updated_at_formatted: Optional[str] = Field(default=None, description="수정일시")
    
    class Meta:
        model = FactoryClient
        fields = "__all__"
