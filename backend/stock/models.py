from django.db import models
from common.models import BaseModel
from factory.models import Factory, FactoryClient


# Create your models here.
class Material(BaseModel):
    factory = models.ForeignKey(
        Factory, related_name="materials", on_delete=models.CASCADE
    )
    name = models.CharField(
        max_length=100,
        help_text="자재명",
    )
    code = models.CharField(
        max_length=100,
        help_text="자재코드",
    )
    unit = models.CharField(
        max_length=10,
        help_text="단위",
    )
    spec = models.CharField(
        max_length=100,
        help_text="규격",
    )
    current_stock = models.IntegerField(
        default=0,
        help_text="현재 재고",
    )
    standard_stock = models.IntegerField(
        default=0,
        help_text="안전 재고",
    )
    location = models.ManyToManyField(
        "location.Location",
        related_name="materials",
        blank=True,
        help_text="위치",
    )

    class Meta:
        unique_together = ["factory", "code"]
        ordering = ["-created_at"]


class MaterialHistory(BaseModel):
    class MaterialHistoryType(models.TextChoices):
        purchase = ("구매", "purchase")
        consumption = ("소모", "consumption")

    type = models.CharField(
        max_length=10,
        choices=MaterialHistoryType.choices,
        default=MaterialHistoryType.purchase,
    )
    material = models.ForeignKey(
        Material, related_name="histories", on_delete=models.CASCADE
    )
    client = models.ForeignKey(
        FactoryClient,
        related_name="material_histories",
        on_delete=models.CASCADE,
        help_text="고객",
    )
    quantity = models.IntegerField(
        help_text="재고 변동 수량",
    )
    price = models.IntegerField(
        null=True,
        blank=True,
        help_text="구매 단가 (원자재 구매 시에만 입력)",
    )
    total_stock = models.IntegerField(
        help_text="재고 변동 후 재고",
    )
    purchase_tax_invoice = models.ForeignKey(
        "tax.NationalTaxService",
        related_name="material_histories",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="구매 세금계산서",
    )
    cash_receipt = models.ForeignKey(
        "tax.CashReceipt",
        related_name="material_histories",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="현금영수증",
    )


class Product(BaseModel):
    factory = models.ForeignKey(
        Factory, related_name="products", on_delete=models.CASCADE
    )
    name = models.CharField(
        max_length=100,
        help_text="제품명",
    )
    code = models.CharField(
        max_length=100,
        help_text="제품코드",
    )
    unit = models.CharField(
        max_length=10,
        help_text="단위",
    )
    spec = models.CharField(
        max_length=100,
        help_text="규격",
    )
    current_stock = models.IntegerField(
        default=0,
        help_text="현재 재고",
    )
    average_production_time = models.IntegerField(
        null=True,
        blank=True,
        help_text="평균 생산 시간 (초 단위)",
    )
    buffer_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.10,
        help_text="재고 버퍼 비율 (기본값: 10%)",
    )
    location = models.ManyToManyField(
        "location.Location",
        related_name="products",
        blank=True,
        help_text="위치",
    )
    note = models.TextField(
        null=True,
        blank=True,
        help_text="특이사항",
    )


class ProductHistory(BaseModel):
    class ProductHistoryType(models.TextChoices):
        IN = ("입고", "in")
        OUT = ("출고", "out")

    type = models.CharField(
        max_length=10,
        choices=ProductHistoryType.choices,
        default=ProductHistoryType.IN,
    )
    product = models.ForeignKey(
        Product, related_name="histories", on_delete=models.CASCADE
    )
    quantity = models.IntegerField(
        help_text="재고 변동 수량",
    )
    total_stock = models.IntegerField(
        help_text="재고 변동 후 재고",
    )


class MaterialProduct(BaseModel):
    product = models.ForeignKey(
        Product, related_name="material_products", on_delete=models.CASCADE
    )
    material = models.ForeignKey(
        Material, related_name="material_products", on_delete=models.CASCADE
    )
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="제품 1개 생산에 필요한 원자재 수량"
    )
