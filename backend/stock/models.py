from django.db import models
from common.models import BaseModel
from factory.models import Factory


# Create your models here.
class Material(BaseModel):
    factory = models.ForeignKey(Factory, on_delete=models.CASCADE)
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
        help_text="현재 재고",
    )
    standard_stock = models.IntegerField(
        help_text="안전 재고",
    )
    # 이 원자재로 만들 수 있는 품목들
    products = models.ManyToManyField(
        "Product",
        through="MaterialProduct",
        related_name="materials",
        help_text="이 원자재로 만들 수 있는 품목들",
    )


class Product(BaseModel):
    factory = models.ForeignKey(Factory, on_delete=models.CASCADE)
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
        help_text="재고 버퍼 비율",
    )
    location = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="위치",
    )
    note = models.TextField(
        null=True,
        blank=True,
        help_text="특이사항",
    )


class MaterialProduct(BaseModel):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, help_text="원자재")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, help_text="제품")
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="제품 1개 생산에 필요한 원자재 수량"
    )
