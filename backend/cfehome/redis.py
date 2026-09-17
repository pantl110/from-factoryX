def build_redis_url(host: str, port: int, db: int, password: str | None) -> str:
    """Redis 비밀번호가 있을 때만 인증 정보를 URL에 포함합니다."""
    if password:
        return f"redis://:{password}@{host}:{port}/{db}"
    return f"redis://{host}:{port}/{db}"
