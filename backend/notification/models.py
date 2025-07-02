from django.db import models
from common.models import BaseModel
from factory.models import FactoryMember


# Create your models here.
class Notification(BaseModel):
    class NotificationType(models.TextChoices):
        due_date = ("납기일 임박", "due_date")
        manufactured = ("생산 완료", "manufactured")
        lack = ("부족", "lack")
        tax_un_published = ("세금계산서 미발행", "tax_un_published")

    receiver = models.ForeignKey(
        FactoryMember, on_delete=models.CASCADE, help_text="수신자"
    )
    type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.due_date,
        help_text="알림 유형",
    )
    content = models.TextField(help_text="알림 내용")
    is_read = models.BooleanField(
        default=False,
        help_text="읽음 여부",
    )
