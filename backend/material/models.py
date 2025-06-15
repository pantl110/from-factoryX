from django.db import models
import uuid

# Create your models here.

class Material(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="자재명")
    code = models.CharField(max_length=50, unique=True, help_text="자재코드")
    specification = models.CharField(max_length=100, help_text="규격")
    unit = models.CharField(max_length=20, help_text="단위")
    current_stock = models.PositiveIntegerField(default=0, help_text="현재 재고")
    min_stock = models.PositiveIntegerField(default=0, help_text="최소재고")
    expiration_date = models.DateField(null=True, blank=True, help_text="유통기한")
    received_date = models.DateField(help_text="입고일자")
    warehouse_location = models.CharField(max_length=100, help_text="창고위치")

    def __str__(self):
        return f"{self.name} ({self.code})"
