from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apikey.models import ApiKey, generate_api_key
from factory.models import Factory
from subscription.models import Subscription, SubscriptionHistory


User = get_user_model()


class PartnerApiKeyReadOnlyTests(TestCase):
    """PARTNER API Key는 문서 대상 조회 API에만 사용할 수 있다."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="partner-api-key-test",
            email="partner-api-key-test@example.com",
            password="test-password",
        )
        self.factory = Factory.objects.create(name="파트너 API 테스트 공장", owner=self.user)

        subscription = Subscription.objects.create(
            type=Subscription.SubscriptionType.partners,
            price=0,
            tax_invoice_count=0,
        )
        today = timezone.localdate()
        SubscriptionHistory.objects.create(
            factory=self.factory,
            subscription=subscription,
            start_date=today,
            end_date=today + timedelta(days=1),
        )

        self.raw_key, prefix, key_hash = generate_api_key(is_test=True)
        ApiKey.objects.create(
            factory=self.factory,
            name="조회 전용 자동 테스트",
            key_prefix=self.raw_key[: len(prefix) + 8],
            key_hash=key_hash,
            is_test=True,
        )
        self.headers = {"HTTP_AUTHORIZATION": f"Bearer {self.raw_key}"}

    def test_api_key_can_read_partner_material_list(self):
        response = self.client.get(
            f"/v1/stock/material?factory_id={self.factory.id}",
            **self.headers,
        )

        self.assertEqual(response.status_code, 200)

    def test_api_key_cannot_use_project_write_endpoints(self):
        write_requests = [
            ("post", f"/v1/project?factory_id={self.factory.id}"),
            ("post", f"/v1/project/clone?factory_id={self.factory.id}"),
            ("patch", f"/v1/project/999/status?factory_id={self.factory.id}"),
            ("patch", f"/v1/project/999/transact-date?factory_id={self.factory.id}"),
            ("delete", f"/v1/project/999?factory_id={self.factory.id}"),
            ("post", f"/v1/project-plan?factory_id={self.factory.id}"),
            ("patch", f"/v1/project-plan/999?factory_id={self.factory.id}"),
            ("post", f"/v1/project-log?factory_id={self.factory.id}"),
            ("patch", f"/v1/project-log/999?factory_id={self.factory.id}"),
        ]

        for method, path in write_requests:
            response = getattr(self.client, method)(path, **self.headers)
            self.assertEqual(response.status_code, 401, path)

    def test_api_key_cannot_read_non_partner_endpoints(self):
        non_partner_paths = [
            f"/v1/project/999?factory_id={self.factory.id}",
            f"/v1/project-plan/ongoing?factory_id={self.factory.id}",
            f"/v1/project-plan/completed?factory_id={self.factory.id}",
            f"/v1/project-plan/daily?factory_id={self.factory.id}",
            f"/v1/project-plan/profit-rate?factory_id={self.factory.id}",
        ]

        for path in non_partner_paths:
            response = self.client.get(path, **self.headers)
            self.assertEqual(response.status_code, 401, path)
