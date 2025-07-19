from ninja import Schema


class LinkTaxInvoiceIn(Schema):
    project_id: int
    tax_id: int  # 배열에서 단일 값으로 변경
