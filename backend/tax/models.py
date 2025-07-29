from django.db import models
from common.models import BaseModel
from factory.models import FactoryClient, Factory
from django.utils import timezone
import random


class TransactionType(models.TextChoices):
    receipt = ("영수", "receipt")
    invoice = ("청구", "invoice")


class TaxInvoiceType(models.TextChoices):
    sales = ("매출", "sales")
    purchase = ("매입", "purchase")


class PublishStatus(models.TextChoices):
    temporary = ("임시 저장", "temporary")
    pending = ("발행 대기", "pending")
    published = ("발행 완료", "published")


# 국세청 API 세금계산서 데이터 저장
class NationalTaxService(BaseModel):
    # factory? 공장 = 회사
    user = models.ForeignKey(
        "user.User",
        related_name="national_tax_services",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="사용자",
    )
    factory = models.ForeignKey(
        "factory.Factory",
        related_name="national_tax_services",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    publish_status = models.CharField(
        max_length=10,
        choices=PublishStatus.choices,
        default=PublishStatus.temporary,
        help_text="발행 상태",
    )
    tax_invoice_type = models.CharField(
        max_length=10,
        choices=TaxInvoiceType.choices,
        default=TaxInvoiceType.sales,
        help_text="세금계산서 유형",
    )
    transaction_type = models.CharField(
        max_length=10,
        choices=TransactionType.choices,
        default=TransactionType.receipt,
        help_text="거래 유형",
    )
    transaction_date = models.DateField(help_text="거래 일자")
    client = models.ForeignKey(
        FactoryClient, related_name="tax_invoices", on_delete=models.CASCADE
    )
    product = models.ManyToManyField(
        "stock.Product",
        related_name="tax_invoices",
        help_text="품목명",
    )
    transaction_amount = models.IntegerField(help_text="공급 가액")
    tax_amount = models.IntegerField(help_text="세액")
    is_hidden = models.BooleanField(default=False, help_text="숨김 여부")
    mgt_key = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="관리 키",
    )
    nts_send_key = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="국세청 승인번호",
    )
    barobill_state = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="바로빌 상태",
    )
    nts_send_state = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        help_text="국세청 전송 상태",
    )
    # 세금계산서 발행할 필요한 정보들...
    line_items = models.JSONField(
        default=list,
        blank=True,
        help_text="세금계산서 품목 리스트",
    )

    def save(self, *args, **kwargs):
        if not self.mgt_key:
            # Generate a unique management key
            new_key = "".join(random.choices("0123456789", k=20))
            while NationalTaxService.objects.filter(mgt_key=new_key).exists():
                new_key = "".join(random.choices("0123456789", k=20))
            self.mgt_key = new_key
        return super().save(*args, **kwargs)


# 국세청 API 현금 영수증 데이터 저장
class CashReceipt(BaseModel):
    # user = models.ForeignKey(
    #     "user.User",
    #     related_name="cash_receipts",
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     help_text="사용자",
    # )
    # factory = models.ForeignKey(
    #     "factory.Factory",
    #     related_name="cash_receipts",
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    # )
    transaction_date = models.DateField(help_text="거래 일자")
    approval_number = models.CharField(max_length=100, help_text="승인번호")
    transaction_classification = models.CharField(
        max_length=100,
        help_text="거래 구분",
    )
    transaction_purpose = models.CharField(
        max_length=100,
        help_text="거래 용도",
    )
    client = models.ForeignKey(
        FactoryClient, related_name="cash_receipts", on_delete=models.CASCADE
    )
    product = models.ManyToManyField(
        "stock.Product",
        related_name="cash_receipts",
        help_text="품목명",
    )
    transaction_amount = models.IntegerField(help_text="공급 가액")
    tax_amount = models.IntegerField(help_text="세액")
