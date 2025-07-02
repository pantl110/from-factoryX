from django.db import models
from common.models import BaseModel
from factory.models import Factory, FactoryClient
from project.models import Project
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


class TaxInvoice(BaseModel):
    class TaxInvoiceType(models.TextChoices):
        receipt = ("영수", "receipt")
        invoice = ("청구", "invoice")

    type = models.CharField(
        max_length=10,
        choices=TaxInvoiceType.choices,
        default=TaxInvoiceType.receipt,
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    client = models.ForeignKey(FactoryClient, on_delete=models.CASCADE)
    products = models.ManyToManyField(
        Product,
        through="TaxInvoiceProduct",
        help_text="세금계산서에 포함된 제품들",
    )