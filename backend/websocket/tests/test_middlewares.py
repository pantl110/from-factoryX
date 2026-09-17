from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import jwt
from asgiref.sync import async_to_sync
from django.conf import settings
from django.test import SimpleTestCase

from websocket.middlewares import CustomAuthMiddleware


class CustomAuthMiddlewareTestCase(SimpleTestCase):
    def setUp(self):
        self.inner = AsyncMock()
        self.middleware = CustomAuthMiddleware(self.inner)
        self.receive = AsyncMock()
        self.send = AsyncMock()

    def token(self, **claims):
        payload = {"user_id": 7, **claims}
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    def run_middleware(self, cookie=None):
        headers = []
        if cookie is not None:
            headers.append((b"cookie", cookie.encode("latin-1")))
        scope = {"type": "websocket", "headers": headers}
        async_to_sync(self.middleware)(scope, self.receive, self.send)
        return scope

    def test_authenticates_valid_access_cookie_without_logging_identity(self):
        user = object()
        token = self.token()
        self.middleware.get_user = AsyncMock(return_value=user)

        with self.assertLogs("websocket.middlewares", level="INFO") as logs:
            scope = self.run_middleware(f"session=abc; access={token}")

        self.assertIs(scope["user"], user)
        self.assertIn("event=authenticated", "\n".join(logs.output))
        self.assertNotIn(token, "\n".join(logs.output))
        self.assertNotIn("session=abc", "\n".join(logs.output))

    def test_missing_access_cookie_uses_anonymous_scope(self):
        with self.assertLogs("websocket.middlewares", level="INFO") as logs:
            scope = self.run_middleware("session=abc")

        self.assertIsNone(scope["user"])
        self.assertIn("event=token_missing", "\n".join(logs.output))

    def test_expired_token_uses_anonymous_scope(self):
        token = self.token(exp=datetime.now(timezone.utc) - timedelta(seconds=1))

        with self.assertLogs("websocket.middlewares", level="INFO") as logs:
            scope = self.run_middleware(f"access={token}")

        self.assertIsNone(scope["user"])
        self.assertIn("event=token_expired", "\n".join(logs.output))

    def test_invalid_token_uses_anonymous_scope(self):
        with self.assertLogs("websocket.middlewares", level="WARNING") as logs:
            scope = self.run_middleware("access=not-a-jwt")

        self.assertIsNone(scope["user"])
        self.assertIn("event=invalid_token", "\n".join(logs.output))

    def test_unknown_user_uses_anonymous_scope(self):
        self.middleware.get_user = AsyncMock(return_value=None)

        with self.assertLogs("websocket.middlewares", level="WARNING") as logs:
            scope = self.run_middleware(f"access={self.token()}")

        self.assertIsNone(scope["user"])
        self.assertIn("event=user_not_found", "\n".join(logs.output))

    def test_log_messages_are_cp949_safe(self):
        with self.assertLogs("websocket.middlewares", level="INFO") as logs:
            self.run_middleware()

        for message in logs.output:
            message.encode("cp949")

    def test_inner_application_is_called_for_every_result(self):
        scope = self.run_middleware()

        self.inner.assert_awaited_once_with(scope, self.receive, self.send)

    def test_django_test_suite_uses_in_memory_channel_layer(self):
        self.assertEqual(
            settings.CHANNEL_LAYERS["default"]["BACKEND"],
            "channels.layers.InMemoryChannelLayer",
        )
