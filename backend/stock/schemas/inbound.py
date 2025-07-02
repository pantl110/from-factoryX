from pydantic import BaseModel
from typing import Optional, List, Any

class MaterialCreateSchema(BaseModel):
    factory_id: int
    name: str
    code: str
    unit: str
    spec: str
    current_stock: Optional[int] = 0
    standard_stock: Optional[int] = 0

class MaterialUpdateSchema(BaseModel):
    name: Optional[str]
    code: Optional[str]
    unit: Optional[str]
    spec: Optional[str]
    current_stock: Optional[int]
    standard_stock: Optional[int]

class MaterialExcelUploadResponseSchema(BaseModel):
    success: bool
    message: str
    data: Optional[List[Any]] = None