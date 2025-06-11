from django.db import models

# Create your models here.

class Equipment(models.Model):
    status = models.CharField(max_length=50, help_text="설비상태")
    name = models.CharField(max_length=100, help_text="설비명")
    type = models.CharField(max_length=50, help_text="설비유형")
    producible_items = models.ManyToManyField(
        'item.Item',
        related_name='equipments',
        blank=True,
        help_text='생산가능품목'
    )
    production_time_per_unit = models.FloatField(null=True, blank=True, help_text="단위당생산시간(분/시간 등)")
    location = models.CharField(max_length=100, help_text="위치")

    def __str__(self):
        return f"{self.name} ({self.status})"
