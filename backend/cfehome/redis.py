from django.core.exceptions import ImproperlyConfigured


VALID_ENVIRONMENTS = {"local", "test", "staging", "production"}
PASSWORD_REQUIRED_ENVIRONMENTS = {"staging", "production"}


def build_redis_url(host: str, port: int, db: int, password: str | None) -> str:
    """Redis 비밀번호가 있을 때만 인증 정보를 URL에 포함합니다."""
    if password:
        return f"redis://:{password}@{host}:{port}/{db}"
    return f"redis://{host}:{port}/{db}"


def validate_redis_auth_policy(
    environment: str | None,
    password: str | None,
) -> None:
    """실행 환경을 확인하고 스테이징·운영에서 Redis 인증을 강제합니다."""
    if environment not in VALID_ENVIRONMENTS:
        raise ImproperlyConfigured(
            "DJANGO_ENV_NAME은 local, test, staging, production 중 하나여야 합니다."
        )

    if environment in PASSWORD_REQUIRED_ENVIRONMENTS and not password:
        raise ImproperlyConfigured(
            "staging 또는 production 환경에서는 REDIS_PASSWORD가 필요합니다."
        )
