from ninja import ModelSchema, Schema, Field
from subscription.models import Subscription, SubscriptionHistory, Payment
from typing import Optional
from datetime import datetime


class SubscriptionOut(ModelSchema):
    class Meta:
        model = Subscription
        fields = "__all__"


class SubscriptionHistoryOut(ModelSchema):
    subscription: SubscriptionOut

    class Meta:
        model = SubscriptionHistory
        exclude = [
            "factory",
        ]


class PaymentOut(ModelSchema):
    """결제 내역 출력 스키마"""

    class Meta:
        model = Payment
        fields = [
            "id",
            "payment_key",
            "order_id",
            "amount",
            "status",
            "method",
            "approved_at",
            "failure_code",
            "failure_message",
            "card_company",
            "card_type",
            "card_number",
            "card_owner_type",
            "created_at",
            "updated_at",
        ]


class BillingKeyIssueOut(Schema):
    """빌링키 발급 응답 스키마"""

    billing_key: str = Field(..., description="발급된 빌링키")
    customer_key: str = Field(..., description="고객키")
    card_company: Optional[str] = Field(None, description="카드사")
    card_type: Optional[str] = Field(None, description="카드 타입")
    card_number: Optional[str] = Field(None, description="마스킹된 카드번호")


class PaymentResultOut(Schema):
    """결제 결과 응답 스키마"""

    # 구독 정보
    subscription_id: int = Field(..., description="구독 ID")
    subscription_type: str = Field(..., description="구독 타입")
    payment_key: str = Field(..., description="결제키")
    order_id: str = Field(..., description="주문ID")
    amount: int = Field(..., description="결제 금액")
    status: str = Field(..., description="결제 상태")
    approved_at: Optional[datetime] = Field(None, description="승인 일시")
    method: Optional[str] = Field(None, description="결제 방법")

    # 카드 정보
    card_company: Optional[str] = Field(None, description="카드사명")
    card_type: Optional[str] = Field(None, description="카드 타입 (신용/체크)")
    card_number: Optional[str] = Field(None, description="마스킹된 카드번호")
    card_owner_type: Optional[str] = Field(
        None, description="카드 소유자 타입 (개인/법인)"
    )


class PaymentCancelOut(Schema):
    """결제 취소 응답 스키마"""

    payment_key: str = Field(..., description="결제키")
    cancel_amount: int = Field(..., description="취소 금액")
    cancel_reason: str = Field(..., description="취소 사유")
    canceled_at: datetime = Field(..., description="취소 일시")


class SubscriptionStatusOut(Schema):
    """구독 상태 조회 응답 스키마"""

    subscription_history: SubscriptionHistoryOut
    current_payment: Optional[PaymentOut]
    next_billing_date: Optional[str] = Field(None, description="다음 결제일")
    is_active: bool = Field(..., description="구독 활성 상태")
