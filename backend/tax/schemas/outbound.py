from datetime import date
from typing import List, Optional
from ninja import Schema, ModelSchema
from tax.models import NationalTaxService, CashReceipt
from stock.schemas.outbound import ProductOut, MaterialDetailOut


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


class NationalTaxServiceOut(ModelSchema):
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
