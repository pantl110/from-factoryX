import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from websocket.middlewares import CustomAuthMiddleware
from notification.routing import websocket_urlpatterns

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cfehome.settings")

# 1. Django 앱 먼저 초기화
django_asgi_app = get_asgi_application()

# 2. ProtocolTypeRouter 구성
application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            CustomAuthMiddleware(URLRouter(websocket_urlpatterns))
        ),
    }
)
