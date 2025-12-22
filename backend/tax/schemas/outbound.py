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


class TaxInvoiceAccountSimpleOut(ModelSchema):
    """세금계산서 목록에서 사용하는 간단한 TaxInvoiceAccount 스키마 (순환 참조 방지)"""
    class Meta:
        model = TaxInvoiceAccount
        exclude = ["tax_invoice", "cash_receipt"]


class NationalTaxServiceOut(ModelSchema):
    project_id: Optional[int] = Field(default=None, description="연결된 프로젝트 ID")
    account: Optional[TaxInvoiceAccountSimpleOut] = Field(default=None, description="채권/채무 정보")

    class Meta:
        model = NationalTaxService
        fields = "__all__"

    @staticmethod
    def resolve_account(obj):
        """TaxInvoiceAccount 정보를 반환"""
        # 비동기 컨텍스트에서 안전하게 처리
        # __dict__를 직접 확인하여 hasattr/getattr 호출 방지
        try:
            obj_dict = getattr(obj, '__dict__', {})
            if '_cached_account' in obj_dict:
                return obj_dict['_cached_account']
        except Exception:
            # 비동기 컨텍스트에서 접근 실패 시 None 반환
            pass
        
        # 캐시되지 않은 경우 None 반환 (pending/unlinked API)
        return None


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
    is_hidden: bool = Field(default=False, description="숨김 여부")
    account: Optional[TaxInvoiceAccountSimpleOut] = Field(default=None, description="채권/채무 정보")


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


class CashReceiptOut(ModelSchema):
    class Meta:
        model = CashReceipt
        fields = "__all__"


class TaxInvoiceAccountOut(ModelSchema):
    # 세금계산서 정보까지 함께 내려주기 위해 중첩 스키마 추가
    tax_invoice: Optional[NationalTaxServiceOut] = None
    cash_receipt: Optional[CashReceiptOut] = None
    client: Optional[FactoryClientOut] = None

    class Meta:
        model = TaxInvoiceAccount
        fields = "__all__"

    @staticmethod
    def resolve_tax_invoice(obj):
        """tax_invoice가 있으면 반환, 없으면 None"""
        return obj.tax_invoice if obj.tax_invoice else None

    @staticmethod
    def resolve_cash_receipt(obj):
        """cash_receipt가 있으면 반환, 없으면 None"""
        return obj.cash_receipt if obj.cash_receipt else None

    @staticmethod
    def resolve_client(obj):
        """tax_invoice 또는 cash_receipt의 client 정보를 반환"""
        if obj.tax_invoice and obj.tax_invoice.client:
            return obj.tax_invoice.client
        if obj.cash_receipt and obj.cash_receipt.client:
            return obj.cash_receipt.client
        return None
