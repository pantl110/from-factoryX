from django.db import models
from common.models import BaseModel
from factory.models import Factory, FactoryClient
from stock.models import Product


# Create your models here.
class Quotation(BaseModel):
    factory = models.ForeignKey(Factory, on_delete=models.CASCADE)
    client = models.ForeignKey(FactoryClient, on_delete=models.CASCADE)
    products = models.ManyToManyField(
        Product,
        through="QuotationProduct",
        help_text="견적서에 포함된 제품들",
    )
    due_date = models.DateField(help_text="납기일자")


class QuotationProduct(BaseModel):
    quotation = models.ForeignKey(
        Quotation, on_delete=models.CASCADE, help_text="견적서"
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, help_text="제품")
    quantity = models.IntegerField(help_text="수량")
    unit_price = models.IntegerField(help_text="단가")
    is_delivery = models.BooleanField(
        default=False,
        help_text="납품 여부",
    )
    delivery_date = models.DateField(
        null=True,
        blank=True,
        help_text="납품 일자",
    )


# 거래명세서
class FinancialDocument(BaseModel):
    class TaxInvoiceStatus(models.TextChoices):
        pending = ("미발행", "pending")
        processing = ("발행 중", "processing")
        completed = ("발행 완료", "completed")

    factory = models.ForeignKey(Factory, on_delete=models.CASCADE)
    is_transaction_publish = models.BooleanField(
        default=False,
        help_text="거래명세서 발행 여부",
    )
    tax_invoice_status = models.CharField(
        max_length=10,
        choices=TaxInvoiceStatus.choices,
        default=TaxInvoiceStatus.pending,
        help_text="세금계산서 발행 상태",
    )
    transact_date = models.DateField(help_text="거래명세서 발행 일자")
    tax_invoice_date = models.DateField(help_text="세금계산서 발행 일자")
