from django.test import SimpleTestCase

from cfehome.redis import build_redis_url


class RedisUrlTestCase(SimpleTestCase):
    def test_builds_url_without_auth_when_password_is_missing(self):
        self.assertEqual(
            build_redis_url("localhost", 6379, 1, None),
            "redis://localhost:6379/1",
        )

    def test_builds_url_with_auth_when_password_exists(self):
        self.assertEqual(
            build_redis_url("localhost", 6379, 1, "secret"),
            "redis://:secret@localhost:6379/1",
        )
