from django.db import models
from common.models import BaseModel


class Substitute(BaseModel):
    """대체 자재 관계 - 단방향 (source 자재의 대체 가능한 자재들)"""

    factory = models.ForeignKey(
        "factory.Factory",
        related_name="substitutes",
        on_delete=models.CASCADE,
        help_text="공장",
    )
    source_material = models.ForeignKey(
        "stock.Material",
        related_name="substitute_relations",
        on_delete=models.CASCADE,
        help_text="이 자재의 대체 가능한 자재들을 정의",
    )
    target_materials = models.ManyToManyField(
        "stock.Material",
        related_name="substituted_by_relations",
        help_text="대체 가능한 자재 목록 (단방향: source_material의 대체 자재들)",
    )

    class Meta:
        ordering = ["-created_at"]
        unique_together = [["factory", "source_material"]]
        verbose_name = "Substitute"
        verbose_name_plural = "Substitutes"

    def __str__(self):
        return f"{self.source_material.name} -> 대체 자재 관계 ({self.factory.name})"
