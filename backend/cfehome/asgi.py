import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cfehome.settings")

# 먼저 Django 앱 초기화
django_asgi_app = get_asgi_application()

# 앱 초기화 뒤에 미들웨어, URL 패턴 import
from websocket.middlewares import CustomAuthMiddleware
from notification.routing import websocket_urlpatterns

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            CustomAuthMiddleware(URLRouter(websocket_urlpatterns))
        ),
    }
)
