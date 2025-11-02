from django.db import models
from common.models import BaseModel


# Create your models here.
class Location(BaseModel):
    class LocationType(models.TextChoices):
        material = ("material", "자재")
        product = ("product", "제품")

    class LocationRole(models.TextChoices):
        admin = ("admin", "시스템 관리자")
        manager = ("manager", "운영자")
        viewer = ("viewer", "조회자")
        prod_manager = ("prod_manager", "생산담당자")

    type = models.CharField(
        max_length=10,
        choices=LocationType.choices,
        default=LocationType.material,
    )
    role = models.CharField(
        max_length=20,
        choices=LocationRole.choices,
        null=True,
        blank=True,
        help_text="역할",
    )
    member = models.ForeignKey(
        "factory.FactoryMember",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="팩토리 member id",
    )
    location = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="창고위치명",
    )
    detail_location = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="상세위치",
    )
    memo = models.TextField(
        null=True,
        blank=True,
        help_text="메모",
    )
    images = models.JSONField(
        default=list,
        null=True,
        blank=True,
        help_text="위치 이미지 URL 목록",
    )