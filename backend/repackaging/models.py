from django.db import models
from common.models import BaseModel


class MaterialRepackaging(BaseModel):
    """원자재 구매 이력의 소분 내역"""
    parent_history = models.ForeignKey(
        "stock.MaterialHistory",
        related_name="repackagings",
        on_delete=models.CASCADE,
        help_text="부모 구매 이력",
    )
    lot_number = models.CharField(
        max_length=100,
        help_text="소분된 LOT 번호 (부모 로트번호-01, -02 형식으로 자동 생성)",
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="현재 잔량",
    )
    warehouse_location = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="창고 위치",
    )
    expiration_date = models.DateField(
        null=True,
        blank=True,
        help_text="유통기한",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "원자재 소분 내역"
        verbose_name_plural = "원자재 소분 내역"

    @property
    def parent_history_lot_number(self):
        """부모 이력의 로트 번호"""
        return self.parent_history.lot_number if self.parent_history else None

    def __str__(self):
        return f"{self.lot_number} ({self.quantity})"
