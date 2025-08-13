import jwt
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.exceptions import AppRegistryNotReady
from django.conf import settings


class CustomAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        try:
            # 지연 로드로 get_user_model()을 여기서 호출
            User = get_user_model()

            # 쿠키에서 토큰 추출
            headers = dict(scope["headers"])
            cookie_header = headers.get(b"cookie", b"").decode()

            # 디버깅: 받은 헤더 정보 로그
            print(f"🐍 WebSocket Headers: {headers}")
            print(f"🐍 Cookie Header: {cookie_header}")

            cookies = {}
            if cookie_header:
                try:
                    for cookie in cookie_header.split(";"):
                        cookie = cookie.strip()
                        if "=" in cookie:
                            key, value = cookie.split("=", 1)
                            cookies[key.strip()] = value.strip()
                except Exception as cookie_parse_error:
                    print(f"🐍 Cookie parsing error: {cookie_parse_error}")
                    cookies = {}

            token = cookies.get("access")

            print(f"🐍 Parsed Cookies: {list(cookies.keys())}")
            print(f"🐍 Access Token: {'Found' if token else 'Not Found'}")

            if token:
                try:
                    # 토큰 검증
                    payload = jwt.decode(
                        token, settings.SECRET_KEY, algorithms=["HS256"]
                    )
                    user_id = payload["user_id"]
                    user = await self.get_user(User, user_id)
                    if user:
                        print(f"🐍 User authenticated: {user.email} (ID: {user.id})")
                        scope["user"] = user
                    else:
                        print(f"🐍 User not found for ID: {user_id}")
                        scope["user"] = None
                except jwt.ExpiredSignatureError:
                    print("🐍 JWT Token expired")
                    scope["user"] = None
                except jwt.InvalidTokenError as e:
                    print(f"🐍 JWT Token invalid: {e}")
                    scope["user"] = None
            else:
                print("🐍 No access token found in cookies")
                scope["user"] = None
        except AppRegistryNotReady:
            print("🐍 App registry not ready")
            scope["user"] = None
        except Exception as e:
            print(f"🐍 WebSocket middleware error: {e}")
            scope["user"] = None
        return await self.inner(scope, receive, send)

    @database_sync_to_async
    def get_user(self, User, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
