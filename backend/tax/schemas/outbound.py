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
