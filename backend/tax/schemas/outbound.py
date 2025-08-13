from datetime import date
from typing import List, Optional
from ninja import Schema, ModelSchema
from tax.models import NationalTaxService


class NationalTaxServiceOut(ModelSchema):
    class Meta:
        model = NationalTaxService
        fields = "__all__"


class NotLinkedTaxInvoiceOut(Schema):
    id: int
    tax_invoice_type: str
    transaction_date: date
    client_name: str
    product_names: List[str]
    transaction_amount: int
    tax_amount: int
    total_amount: int


class AllTaxInvoiceOut(Schema):
    id: int
    tax_invoice_type: str
    transaction_date: date
    client_name: str
    product_names: List[str]
    transaction_amount: int
    tax_amount: int
    total_amount: int


class AllCashReceiptOut(Schema):
    id: int
    transaction_date: date
    client_name: str
    product_names: List[str]
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
