from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from cfehome.redis import build_redis_url, validate_redis_auth_policy


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


class RedisAuthPolicyTestCase(SimpleTestCase):
    def test_local_and_test_allow_missing_password(self):
        for environment in ("local", "test"):
            with self.subTest(environment=environment):
                validate_redis_auth_policy(environment, None)

    def test_staging_and_production_require_password(self):
        for environment in ("staging", "production"):
            with self.subTest(environment=environment):
                with self.assertRaisesMessage(
                    ImproperlyConfigured,
                    "staging 또는 production 환경에서는 REDIS_PASSWORD가 필요합니다.",
                ):
                    validate_redis_auth_policy(environment, None)

    def test_all_environments_allow_configured_password(self):
        for environment in ("local", "test", "staging", "production"):
            with self.subTest(environment=environment):
                validate_redis_auth_policy(environment, "secret")

    def test_missing_or_unknown_environment_is_rejected(self):
        for environment in (None, "unknown"):
            with self.subTest(environment=environment):
                with self.assertRaisesMessage(
                    ImproperlyConfigured,
                    "DJANGO_ENV_NAME은 local, test, staging, production 중 하나여야 합니다.",
                ):
                    validate_redis_auth_policy(environment, "secret")
