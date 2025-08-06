from ninja import ModelSchema
from notification.models import Notification


class NotificationOut(ModelSchema):
    class Meta:
        model = Notification
        fields = "__all__"
