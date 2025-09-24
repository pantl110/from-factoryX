from ninja import Schema, Field
from typing import Optional


class SubscriptionHistoryIn(Schema):
    subscription: int = Field(
        ...,
        description="Subscription ID",
    )


# class BillingKeyIssueIn(Schema):
#     """빌링키 발급 요청 스키마"""

#     card_number: str = Field(
#         ..., description="카드 번호 (숫자만)", min_length=15, max_length=16
#     )
#     card_expiry_year: str = Field(
#         ..., description="카드 만료년도 (YY)", min_length=2, max_length=2
#     )
#     card_expiry_month: str = Field(
#         ..., description="카드 만료월 (MM)", min_length=2, max_length=2
#     )
#     card_password: str = Field(
#         ..., description="카드 비밀번호 앞 2자리", min_length=2, max_length=2
#     )
#     customer_identity_number: str = Field(
#         ...,
#         description="생년월일 6자리 또는 사업자등록번호 10자리",
#         min_length=6,
#         max_length=10,
#     )


class BillingKeyIssueIn(Schema):
    """빌링키 발급 요청 스키마"""

    auth_key: str = Field(..., description="토스 위젯에서 받은 authKey")
    customer_key: str = Field(..., description="위젯 초기화 시 사용한 customerKey")


class SubscriptionPaymentIn(Schema):
    """구독 결제 요청 스키마"""

    subscription_id: int = Field(..., description="구독 플랜 ID")
    billing_key: str = Field(..., description="빌링키")
    customer_key: str = Field(..., description="고객키")


class PaymentCancelIn(Schema):
    """결제 취소 요청 스키마"""

    cancel_reason: str = Field(..., description="취소 사유", max_length=200)
    cancel_amount: Optional[int] = Field(
        None, description="부분 취소 금액 (전체 취소시 생략)"
    )
