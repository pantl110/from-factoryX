from datetime import date
from decimal import Decimal
from ninja import Schema, Field
from typing import Optional


class MaterialRepackagingCreateIn(Schema):
    """원자재 소분 생성 요청"""
    parent_history_id: int
    quantity: Decimal
    warehouse_location: Optional[str] = Field(None, description="창고 위치")
    expiration_date: Optional[date] = Field(None, description="유통기한")


class MaterialRepackagingUpdateIn(Schema):
    """원자재 소분 수정 요청"""
    quantity: Optional[Decimal] = Field(None, description="수량")
    warehouse_location: Optional[str] = Field(None, description="창고 위치")
    expiration_date: Optional[date] = Field(None, description="유통기한")

