from ninja import ModelSchema, Field
from repackaging.models import MaterialRepackaging


class MaterialRepackagingOut(ModelSchema):
    """원자재 소분 응답"""
    parent_history_id: int = Field(..., description="부모 구매 이력 ID")
    
    class Config:
        model = MaterialRepackaging
        model_fields = [
            "id",
            "lot_number",
            "quantity",
            "warehouse_location",
            "expiration_date",
            "created_at",
            "updated_at",
        ]
        # property도 포함됨 (parent_history_lot_number)

