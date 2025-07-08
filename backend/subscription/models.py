from django.db import models
from common.models import BaseModel
from factory.models import Factory


# Create your models here.
class Subscription(BaseModel):
    class SubscriptionType(models.TextChoices):
        trial = ("트라이얼", "trial")
        basic = ("기본", "basic")
        partners = ("파트너", "partners")

    type = models.CharField(
        max_length=10,
        choices=SubscriptionType.choices,
        default=SubscriptionType.trial,
    )
    price = models.IntegerField(
        help_text="가격",
    )


class SubscriptionHistory(BaseModel):
    subscription = models.ForeignKey(
        Subscription, related_name="subscription_histories", on_delete=models.CASCADE
    )
    factory = models.ForeignKey(
        Factory, related_name="subscription_histories", on_delete=models.CASCADE
    )
    start_date = models.DateField(
        help_text="시작일",
    )
    end_date = models.DateField(
        help_text="종료일 (다음 결제일)",
    )
