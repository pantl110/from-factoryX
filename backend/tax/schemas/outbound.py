from datetime import date
from typing import List, Optional
from ninja import Schema, ModelSchema, Field
from tax.models import NationalTaxService, CashReceipt, TaxInvoiceAccount, PaymentDetail
from stock.schemas.outbound import ProductOut


# 순환 import 방지를 위한 별도 정의
class FactoryClientOut(Schema):
    id: int
    # type: str
    is_customer: bool
    is_supplier: bool
    name: str
    business_registration_number: Optional[str]
    representative_name: Optional[str]
    business_type: Optional[str]
    business_category: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    fax: Optional[str]
    address: Optional[str]
    manager: Optional[str]
    note: Optional[str]
    # 입금 확인 정보 (수주처용)
    depositor_name: Optional[str] = None
    # 지급 계좌 정보 (발주처용)
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_holder: Optional[str] = None


class NationalTaxServiceOut(ModelSchema):
    project_id: Optional[int] = Field(default=None, description="연결된 프로젝트 ID")

    class Meta:
        model = NationalTaxService
        fields = "__all__"


class NationalTaxServiceDetailOut(ModelSchema):
    client: FactoryClientOut

    class Meta:
        model = NationalTaxService
        fields = "__all__"


class NotLinkedTaxInvoiceOut(Schema):
    id: int
    tax_invoice_type: str
    transaction_date: date
    client_name: str
    transaction_amount: int
    tax_amount: int
    total_amount: int


class AllTaxInvoiceOut(Schema):
    id: int
    tax_invoice_type: str
    transaction_date: date
    client_name: str
    transaction_amount: int
    tax_amount: int
    total_amount: int


class AllCashReceiptOut(Schema):
    id: int
    transaction_date: date
    client_name: str
    transaction_amount: int
    tax_amount: int
    total_amount: int
    item_name: Optional[str] = None


class TaxInvoiceMaterialInfoOut(Schema):
    material_name: str
    spec: str
    quantity: int
    unit: str
    price: int
    transaction_amount: int
    tax_amount: int


class TaxInvoiceByMaterialOut(Schema):
    client_name: str
    business_registration_number: str
    representative_name: Optional[str] = None
    business_type: Optional[str] = None
    business_category: Optional[str] = None
    address: Optional[str] = None
    transaction_date: date
    tax_invoice_type: str
    transaction_type: str
    materials: List[TaxInvoiceMaterialInfoOut]


class CashReceiptMaterialInfoOut(Schema):
    material_name: str
    unit: str
    quantity: int
    price: int
    transaction_amount: int
    tax_amount: int
    total_amount: int


class CashReceiptByMaterialOut(Schema):
    transaction_date: date
    approval_number: str
    transaction_classification: str
    transaction_purpose: str
    client_name: str
    business_registration_number: str
    representative_name: Optional[str] = None
    address: Optional[str] = None
    materials: List[CashReceiptMaterialInfoOut]


class CashReceiptDetailOut(ModelSchema):
    class Meta:
        model = CashReceipt
        fields = "__all__"


class CashReceiptDetailWithMaterialOut(ModelSchema):
    client: FactoryClientOut

    class Meta:
        model = CashReceipt
        fields = "__all__"


class PaymentDetailOut(ModelSchema):
    class Meta:
        model = PaymentDetail
        fields = "__all__"


class TaxInvoiceAccountOut(ModelSchema):
    # 세금계산서 정보까지 함께 내려주기 위해 중첩 스키마 추가
    tax_invoice: NationalTaxServiceOut
    client: Optional[FactoryClientOut] = None

    class Meta:
        model = TaxInvoiceAccount
        fields = "__all__"

    @staticmethod
    def resolve_client(obj):
        """tax_invoice의 client 정보를 반환"""
        if obj.tax_invoice and obj.tax_invoice.client:
            return obj.tax_invoice.client
        return None
