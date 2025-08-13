from django.urls import path
from notification.consumers import NotificationConsumer

websocket_urlpatterns = [
    path("ws/notification/<int:factory_id>/", NotificationConsumer.as_asgi()),
]
