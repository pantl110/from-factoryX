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
    is_canceled = models.BooleanField(
        default=False,
        help_text="구독 취소 여부 (True면 자동 갱신하지 않음)",
    )

    # 토스페이먼츠
    billing_key = models.CharField(
        max_length=255, null=True, blank=True, help_text="빌링키"
    )
    customer_key = models.CharField(
        max_length=255, null=True, blank=True, help_text="고객키"
    )


class Payment(BaseModel):
    """결제 내역 모델"""

    STATUS_CHOICES = [
        ("PENDING", "대기중"),
        ("DONE", "완료"),
        ("CANCELED", "취소"),
        ("FAILED", "실패"),
    ]

    subscription_history = models.ForeignKey(
        SubscriptionHistory, related_name="payments", on_delete=models.CASCADE
    )
    payment_key = models.CharField(
        max_length=255, null=True, blank=True, help_text="결제 키"
    )
    order_id = models.CharField(
        max_length=255, null=True, blank=True, help_text="주문 ID"
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="결제 금액")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="PENDING", help_text="결제 상태"
    )
    method = models.CharField(
        max_length=50, null=True, blank=True, help_text="결제 방법"
    )

    approved_at = models.DateTimeField(null=True, blank=True, help_text="승인 일시")

    # 실패 정보
    failure_code = models.CharField(
        max_length=50, null=True, blank=True, help_text="실패 코드"
    )
    failure_message = models.CharField(
        max_length=255, null=True, blank=True, help_text="실패 메시지"
    )

    # 카드 정보
    card_company = models.CharField(
        max_length=50, null=True, blank=True, help_text="카드사명"
    )
    card_type = models.CharField(
        max_length=20, null=True, blank=True, help_text="카드 타입 (신용/체크)"
    )
    card_number = models.CharField(
        max_length=20, null=True, blank=True, help_text="마스킹된 카드번호"
    )
    card_owner_type = models.CharField(
        max_length=20, null=True, blank=True, help_text="카드 소유자 타입 (개인/법인)"
    )
