from ninja import ModelSchema
from factory.schemas.outbound import FactoryOut
from subscription.models import Subscription, SubscriptionHistory


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
