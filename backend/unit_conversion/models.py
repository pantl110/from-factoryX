from django.db import models
from common.models import BaseModel


class UnitConversion(BaseModel):

    factory = models.ForeignKey(
        'factory.Factory',
        on_delete=models.CASCADE,
        related_name='unit_conversions',
        help_text='공장'
    )
    material = models.ForeignKey(
        'stock.Material',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='unit_conversions',
        help_text='자재'
    )
    product = models.ForeignKey(
        'stock.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='unit_conversions',
        help_text='제품'
    )
    from_unit = models.CharField(
        default='',
        null=True,
        blank=True,
        max_length=50,
        help_text='변환 전 단위'
    )
    to_unit = models.CharField(
        default='',
        null=True,
        blank=True,
        max_length=50,
        help_text='변환 후 단위'
    )
    from_quantity = models.DecimalField(
        default=1,
        max_digits=10,
        decimal_places=4,
        help_text='변환 전 단위의 수량' # 예: 2kg = 3봉 에서 2
    )
    to_quantity = models.DecimalField(
        default=1,
        max_digits=10,
        decimal_places=4,
        help_text='변환 후 단위의 수량' # 예: 2kg = 3봉 에서 3
    )
    decimal_rule = models.CharField(
        max_length=10,
        choices=[
            ('round', '반올림'),
            ('floor', '버림'),
            ('ceil', '올림'),
        ],
        default='round',
        help_text='소수점 처리 방식'
    )

    def __str__(self):
        return f"[{self.factory}] {self.from_quantity}{self.from_unit} = {self.to_quantity}{self.to_unit}"