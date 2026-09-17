import logging
from http.cookies import CookieError, SimpleCookie

import jwt
from channels.db import database_sync_to_async
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import AppRegistryNotReady


logger = logging.getLogger(__name__)


class CustomAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        scope["user"] = None

        try:
            User = get_user_model()
            token = self.get_access_token(scope)

            if token:
                try:
                    payload = jwt.decode(
                        token, settings.SECRET_KEY, algorithms=["HS256"]
                    )
                    user_id = payload.get("user_id")
                    if user_id is None:
                        logger.warning("websocket_auth event=missing_user_claim")
                        return await self.inner(scope, receive, send)

                    user = await self.get_user(User, user_id)
                    if user:
                        scope["user"] = user
                        logger.info("websocket_auth event=authenticated")
                    else:
                        logger.warning("websocket_auth event=user_not_found")
                except jwt.ExpiredSignatureError:
                    logger.info("websocket_auth event=token_expired")
                except jwt.InvalidTokenError:
                    logger.warning("websocket_auth event=invalid_token")
            else:
                logger.info("websocket_auth event=token_missing")
        except AppRegistryNotReady:
            logger.warning("websocket_auth event=app_registry_not_ready")
        except Exception:
            logger.exception("websocket_auth event=unexpected_error")
        return await self.inner(scope, receive, send)

    @staticmethod
    def get_access_token(scope):
        headers = dict(scope.get("headers", []))
        cookie_header = headers.get(b"cookie", b"")
        if not cookie_header:
            return None

        try:
            cookies = SimpleCookie()
            cookies.load(cookie_header.decode("latin-1"))
        except (CookieError, UnicodeDecodeError):
            logger.warning("websocket_auth event=invalid_cookie_header")
            return None

        access_cookie = cookies.get("access")
        return access_cookie.value if access_cookie else None

    @database_sync_to_async
    def get_user(self, User, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
