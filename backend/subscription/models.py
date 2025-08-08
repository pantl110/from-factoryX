from django.db import models
from common.models import BaseModel
from factory.models import Factory


# Create your models here.
class Subscription(BaseModel):
    class SubscriptionType(models.TextChoices):
        trial = ("trial", "트라이얼")
        basic = ("basic", "기본")
        partners = ("partners", "파트너")

    type = models.CharField(
        max_length=10,
        choices=SubscriptionType.choices,
        default=SubscriptionType.trial,
    )
    price = models.IntegerField(
        help_text="가격",
    )
    tax_invoice_count = models.IntegerField(
        help_text="세금계산서 발행 제한 개수",  # 플랜 별 횟수 차별 제공
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
