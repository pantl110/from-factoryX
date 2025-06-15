from django.db import models
import uuid

# Create your models here.

class Equipment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=50, help_text="설비상태")
    name = models.CharField(max_length=100, help_text="설비명")
    type = models.CharField(max_length=50, help_text="설비유형")
    producible_items = models.ManyToManyField(
        'item.Item',
        through='EquipmentItem',
        related_name='equipments',
        blank=True,
        help_text='생산가능품목'
    )
    location = models.CharField(max_length=100, help_text="위치")
    special_notes = models.TextField(null=True, blank=True, help_text="특이사항")

    def __str__(self):
        return f"{self.name} ({self.status})"

class EquipmentItem(models.Model):
    """설비와 품목 간의 관계 (생산 정보 포함)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment = models.ForeignKey('Equipment', on_delete=models.CASCADE)
    item = models.ForeignKey('item.Item', on_delete=models.CASCADE)
    production_time_per_unit = models.FloatField(help_text="단위당 생산시간(분)")
    # production_capacity_per_hour = models.FloatField(null=True, blank=True, help_text="시간당 생산능력")
    
    class Meta:
        unique_together = ('equipment', 'item')
        verbose_name = "설비별 생산품목"
        verbose_name_plural = "설비별 생산품목"
    
    def __str__(self):
        return f"{self.equipment.name} - {self.item.name} (단위당 {self.production_time_per_unit}분)"
