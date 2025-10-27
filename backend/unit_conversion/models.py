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
    conversion_rate = models.DecimalField(
        default=1,
        max_digits=10,
        decimal_places=4,
        help_text='변환 비율'
    )

    def __str__(self):
        return f"[{self.factory}] {self.from_unit} to {self.to_unit} ({self.conversion_rate})"