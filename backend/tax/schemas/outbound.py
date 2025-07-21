from datetime import date
from typing import List, Optional
from ninja import Schema


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