from ninja import Schema, Field


class SubscriptionHistoryIn(Schema):
    subscription: int = Field(
        ...,
        description="Subscription ID",
    )
