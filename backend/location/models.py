from django.db import models
from common.models import BaseModel


# Create your models here.
class Location(BaseModel):
    class LocationType(models.TextChoices):
        material = ("material", "material")
        product = ("product", "product")

    type = models.CharField(
        max_length=10,
        choices=LocationType.choices,
        default=LocationType.material,
    )
    location = models.CharField(
        max_length=100,
        help_text="위치",
    )
    images = models.JSONField(
        default=list,
        null=True,
        blank=True,
        help_text="위치 이미지 URL 목록",
    )
