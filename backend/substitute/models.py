from django.db import models
from common.models import BaseModel


class Substitute(BaseModel):
    """대체 자재 그룹 - 상호 대체 가능한 자재들을 묶는 그룹"""

    factory = models.ForeignKey(
        "factory.Factory",
        related_name="substitutes",
        on_delete=models.CASCADE,
        help_text="공장",
    )
    name = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="그룹명 (예: 'M8 볼트 그룹', 'SUS304 1.5t 판재 그룹')",
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="그룹 설명",
    )
    materials = models.ManyToManyField(
        "stock.Material",
        related_name="substitutes",
        help_text="대체 가능한 자재 목록",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "대체 자재 그룹"
        verbose_name_plural = "대체 자재 그룹"

    def __str__(self):
        return f"{self.name} ({self.factory.name})"
