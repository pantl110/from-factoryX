from typing import List, Optional
from pydantic import BaseModel, EmailStr

# 연락처 스키마
class ContactSchema(BaseModel):
    company_name: str
    business_registration_number: str
    ceo_name: str
    business_type: str = None
    business_item: str = None
    company_address: str
    manager_name: str
    manager_email: EmailStr
    manager_phone: str
    manager_fax: str = None
    memo: str = None

# 견적 요청 아이템 스키마
class QuotationRequestItemSchema(BaseModel):
    item_name: str
    item_code: str
    specification: str
    unit: str
    unit_price: int
    quantity: int
    amount: int

# 견적 요청서 생성 스키마
class CreateQuotationRequestSchema(BaseModel):
    contact: ContactSchema
    due_date: str
    status: str = "요청"
    items: List[QuotationRequestItemSchema]

# 파일 업로드 응답 스키마
class FileUploadResponseSchema(BaseModel):
    success: bool
    message: str
    data: Optional[CreateQuotationRequestSchema] = None
