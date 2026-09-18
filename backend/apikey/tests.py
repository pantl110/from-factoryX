from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone

from apikey.models import ApiKey, generate_api_key
from document.models import Quotation, QuotationProduct, WorkInstruction, WorkInstructionHistory
from factory.models import Factory, FactoryEquipment, FactoryMember
from project.models import Project, ProjectLog, ProjectPlan, Refund
from repackaging.models import MaterialRepackaging
from stock.models import Material, MaterialHistory, Product, ProductHistory
from subscription.models import Subscription, SubscriptionHistory
from unit_conversion.models import UnitConversion
from user.utils import get_access_token


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
        today = timezone.now().date()
        SubscriptionHistory.objects.create(
            factory=self.factory,
            subscription=subscription,
            start_date=today,
            end_date=today + timedelta(days=1),
        )

        self.raw_key, prefix, key_hash = generate_api_key(is_test=True)
        self.api_key = ApiKey.objects.create(
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
            ("post", f"/v1/project/clone?factory_id={self.factory.id}"),
            ("post", f"/v1/project/manufactured-to-delivery/999?factory_id={self.factory.id}"),
            ("patch", f"/v1/project/999/status?factory_id={self.factory.id}"),
            ("patch", f"/v1/project/999/transact-date?factory_id={self.factory.id}"),
            ("delete", f"/v1/project/999?factory_id={self.factory.id}"),
            ("post", f"/v1/project-plan/create-or-update?factory_id={self.factory.id}"),
            ("delete", f"/v1/project-plan/999?factory_id={self.factory.id}"),
            ("post", f"/v1/project-log?factory_id={self.factory.id}"),
            ("patch", f"/v1/project-log/999?factory_id={self.factory.id}"),
        ]

        for method, path in write_requests:
            response = getattr(self.client, method)(path, **self.headers)
            self.assertEqual(response.status_code, 401, path)

    def test_api_key_cannot_read_non_partner_endpoints(self):
        non_partner_paths = [
            f"/v1/project/999?factory_id={self.factory.id}",
            f"/v1/project-plan/dashboard?factory_id={self.factory.id}",
            f"/v1/project-plan/profit/detail?factory_id={self.factory.id}",
            f"/v1/project-plan/profit/summary?factory_id={self.factory.id}",
            f"/v1/project-plan/profit/trend?factory_id={self.factory.id}",
            f"/v1/project-plan/profit/list?factory_id={self.factory.id}",
            f"/v1/document/work-instruction/999?factory_id={self.factory.id}",
        ]

        for path in non_partner_paths:
            response = self.client.get(path, **self.headers)
            self.assertEqual(response.status_code, 401, path)

    def test_invalid_api_key_is_rejected(self):
        response = self.client.get(
            f"/v1/stock/material?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION="Bearer pantl_test_invalid",
        )

        self.assertEqual(response.status_code, 401)

    def test_api_key_cannot_access_another_factory(self):
        other_factory = Factory.objects.create(
            name="다른 공장",
            owner=self.user,
        )

        response = self.client.get(
            f"/v1/stock/material?factory_id={other_factory.id}",
            **self.headers,
        )

        self.assertEqual(response.status_code, 403)

    def test_api_key_is_rate_limited_after_60_requests(self):
        cache_key = f"throttle_partner_api_{self.api_key.key_prefix}"
        cache.delete(cache_key)
        path = f"/v1/stock/material?factory_id={self.factory.id}"

        for _ in range(60):
            response = self.client.get(path, **self.headers)
            self.assertEqual(response.status_code, 200)

        response = self.client.get(path, **self.headers)
        self.assertEqual(response.status_code, 429)

    def test_existing_jwt_user_can_still_read_partner_endpoint(self):
        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
        )
        token, _ = get_access_token({"user_id": str(self.user.id)})

        response = self.client.get(
            f"/v1/stock/material?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)

    def test_api_key_reaches_all_26_partner_read_endpoints(self):
        factory_id = self.factory.id
        partner_paths = [
            f"/v1/stock/material?factory_id={factory_id}",
            f"/v1/stock/material/999?factory_id={factory_id}",
            f"/v1/stock/material/expiry-risk?factory_id={factory_id}",
            f"/v1/stock/material/shortage?factory_id={factory_id}",
            f"/v1/stock/material-history?factory_id={factory_id}",
            f"/v2/stock/material-history/available-lots?material_id=999&factory_id={factory_id}",
            f"/v2/stock/material-history/999?factory_id={factory_id}",
            f"/v2/repackaging?material_id=999&factory_id={factory_id}",
            f"/v2/repackaging/999?factory_id={factory_id}",
            f"/v1/stock/product?factory_id={factory_id}",
            f"/v1/stock/product/999?factory_id={factory_id}",
            f"/v1/stock/product/history?factory_id={factory_id}",
            f"/v1/stock/product/history/999?factory_id={factory_id}",
            f"/v2/unit-conversion?factory_id={factory_id}",
            f"/v2/unit-conversion/material/999?factory_id={factory_id}",
            f"/v2/unit-conversion/product/999?factory_id={factory_id}",
            f"/v1/project-plan?project_id=999&factory_id={factory_id}",
            f"/v1/project-plan/today?factory_id={factory_id}",
            f"/v2/project-plan/dashboard-mobile?base_date=2026-09-14&factory_id={factory_id}",
            f"/v1/document/work-instruction?factory_id={factory_id}",
            f"/v1/document/work-instruction/999/history?factory_id={factory_id}",
            f"/v2/project?factory_id={factory_id}",
            f"/v1/project?factory_id={factory_id}",
            f"/v2/project/stale-confirmed?factory_id={factory_id}",
            f"/v1/project-log?project_id=999&factory_id={factory_id}",
            f"/v1/project-refund/999?factory_id={factory_id}",
        ]

        self.assertEqual(len(partner_paths), 26)
        expected_statuses = {200, 404}

        for path in partner_paths:
            with self.subTest(path=path):
                response = self.client.get(path, **self.headers)
                self.assertIn(
                    response.status_code,
                    expected_statuses,
                    f"{path}: {response.content.decode()}",
                )

    def test_all_26_partner_endpoints_return_400_when_factory_id_is_missing(self):
        partner_paths = [
            "/v1/stock/material",
            "/v1/stock/material/999",
            "/v1/stock/material/expiry-risk",
            "/v1/stock/material/shortage",
            "/v1/stock/material-history",
            "/v2/stock/material-history/available-lots?material_id=999",
            "/v2/stock/material-history/999",
            "/v2/repackaging?material_id=999",
            "/v2/repackaging/999",
            "/v1/stock/product",
            "/v1/stock/product/999",
            "/v1/stock/product/history",
            "/v1/stock/product/history/999",
            "/v2/unit-conversion",
            "/v2/unit-conversion/material/999",
            "/v2/unit-conversion/product/999",
            "/v1/project-plan?project_id=999",
            "/v1/project-plan/today",
            "/v2/project-plan/dashboard-mobile?base_date=2026-09-14",
            "/v1/document/work-instruction",
            "/v1/document/work-instruction/999/history",
            "/v2/project",
            "/v1/project",
            "/v2/project/stale-confirmed",
            "/v1/project-log?project_id=999",
            "/v1/project-refund/999",
        ]

        self.assertEqual(len(partner_paths), 26)

        for path in partner_paths:
            with self.subTest(path=path):
                response = self.client.get(path, **self.headers)
                self.assertEqual(
                    response.status_code,
                    400,
                    f"{path}: {response.content.decode()}",
                )
                self.assertEqual(
                    response.json().get("detail"),
                    "factory_id를 입력해야 합니다.",
                    path,
                )

    def test_non_missing_validation_errors_remain_422(self):
        invalid_factory_response = self.client.get(
            "/v1/stock/material?factory_id=abc",
            **self.headers,
        )
        self.assertEqual(invalid_factory_response.status_code, 422)

        oversized_page_response = self.client.get(
            f"/v1/stock/material?factory_id={self.factory.id}&page_size=101",
            **self.headers,
        )
        self.assertEqual(oversized_page_response.status_code, 422)

    def test_partner_pagination_defaults_to_10_items(self):
        Material.objects.bulk_create(
            [
                Material(
                    factory=self.factory,
                    name=f"PARTNER 페이지 테스트 원자재 {index}",
                    code=f"PARTNER-PAGE-{index:02d}",
                    unit="EA",
                    current_stock=index,
                    standard_stock=0,
                )
                for index in range(12)
            ]
        )

        response = self.client.get(
            f"/v1/stock/material?factory_id={self.factory.id}",
            **self.headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 10)
        self.assertEqual(data["count"], 10)
        self.assertEqual(data["totalCnt"], 12)
        self.assertEqual(data["pageCnt"], 2)

    def test_all_partner_paginated_endpoints_use_documented_page_size(self):
        from cfehome.urls import base_api

        paginated_partner_paths = [
            "/v1/stock/material",
            "/v1/stock/material/expiry-risk",
            "/v1/stock/material-history",
            "/v2/stock/material-history/available-lots",
            "/v2/repackaging",
            "/v1/stock/product",
            "/v1/stock/product/history",
            "/v2/unit-conversion",
            "/v1/document/work-instruction",
            "/v2/project",
            "/v1/project",
            "/v1/project-log",
        ]
        schema = base_api.get_openapi_schema()

        self.assertEqual(len(paginated_partner_paths), 12)
        for path in paginated_partner_paths:
            with self.subTest(path=path):
                page_size = next(
                    parameter["schema"]
                    for parameter in schema["paths"][path]["get"]["parameters"]
                    if parameter["name"] == "page_size"
                )
                self.assertEqual(page_size["default"], 10)
                self.assertEqual(page_size["maximum"], 100)

    def test_api_key_cannot_reach_any_partner_endpoint_for_another_factory(self):
        other_factory = Factory.objects.create(
            name="PARTNER 접근 차단 대상 공장",
            owner=self.user,
        )
        factory_id = other_factory.id
        partner_paths = [
            f"/v1/stock/material?factory_id={factory_id}",
            f"/v1/stock/material/999?factory_id={factory_id}",
            f"/v1/stock/material/expiry-risk?factory_id={factory_id}",
            f"/v1/stock/material/shortage?factory_id={factory_id}",
            f"/v1/stock/material-history?factory_id={factory_id}",
            f"/v2/stock/material-history/available-lots?material_id=999&factory_id={factory_id}",
            f"/v2/stock/material-history/999?factory_id={factory_id}",
            f"/v2/repackaging?material_id=999&factory_id={factory_id}",
            f"/v2/repackaging/999?factory_id={factory_id}",
            f"/v1/stock/product?factory_id={factory_id}",
            f"/v1/stock/product/999?factory_id={factory_id}",
            f"/v1/stock/product/history?factory_id={factory_id}",
            f"/v1/stock/product/history/999?factory_id={factory_id}",
            f"/v2/unit-conversion?factory_id={factory_id}",
            f"/v2/unit-conversion/material/999?factory_id={factory_id}",
            f"/v2/unit-conversion/product/999?factory_id={factory_id}",
            f"/v1/project-plan?project_id=999&factory_id={factory_id}",
            f"/v1/project-plan/today?factory_id={factory_id}",
            f"/v2/project-plan/dashboard-mobile?base_date=2026-09-14&factory_id={factory_id}",
            f"/v1/document/work-instruction?factory_id={factory_id}",
            f"/v1/document/work-instruction/999/history?factory_id={factory_id}",
            f"/v2/project?factory_id={factory_id}",
            f"/v1/project?factory_id={factory_id}",
            f"/v2/project/stale-confirmed?factory_id={factory_id}",
            f"/v1/project-log?project_id=999&factory_id={factory_id}",
            f"/v1/project-refund/999?factory_id={factory_id}",
        ]

        self.assertEqual(len(partner_paths), 26)

        for path in partner_paths:
            with self.subTest(path=path):
                response = self.client.get(path, **self.headers)
                self.assertEqual(
                    response.status_code,
                    403,
                    f"{path}: {response.content.decode()}",
                )

    def test_api_key_cannot_read_another_factory_objects_with_own_factory_id(self):
        """허용된 factory_id와 다른 공장의 객체 ID를 섞어도 데이터가 노출되지 않는다."""
        other_factory = Factory.objects.create(
            name="PARTNER 객체 격리 대상 공장",
            owner=self.user,
        )
        material = Material.objects.create(
            factory=other_factory,
            name="다른 공장 원자재",
            code="OTHER-MATERIAL",
            unit="kg",
            spec="테스트",
        )
        material_history = MaterialHistory.objects.create(
            material=material,
            quantity=10,
            remaining_quantity=10,
            total_stock=10,
        )
        repackaging = MaterialRepackaging.objects.create(
            parent_history=material_history,
            lot_number="OTHER-LOT-01",
            quantity=5,
        )
        product = Product.objects.create(
            factory=other_factory,
            name="다른 공장 제품",
            code="OTHER-PRODUCT",
            unit="개",
            spec="테스트",
        )
        product_history = ProductHistory.objects.create(
            product=product,
            quantity=1,
            total_stock=1,
        )
        UnitConversion.objects.create(factory=other_factory, material=material)
        UnitConversion.objects.create(factory=other_factory, product=product)

        project = Project.objects.create(name="다른 공장 프로젝트")
        quotation = Quotation.objects.create(factory=other_factory, project=project)
        quotation_product = QuotationProduct.objects.create(
            quotation=quotation,
            product=product,
            quantity=1,
            unit_price=1000,
        )
        equipment = FactoryEquipment.objects.create(
            factory=other_factory,
            name="다른 공장 설비",
            priority=1,
        )
        plan = ProjectPlan.objects.create(
            project=project,
            product=quotation_product,
            quantity=1,
            equipment=equipment,
            start_date=datetime(2026, 9, 14, 9, 0),
            end_date=datetime(2026, 9, 14, 10, 0),
        )
        ProjectLog.objects.create(
            project=project,
            title="다른 공장 일반 로그",
            content="격리 검사",
        )
        refund = Refund.objects.create(
            product=product,
            plan=plan,
            amount=1,
            refund_date=timezone.now().date(),
            current_stock=0,
        )
        ProjectLog.objects.create(
            project=project,
            type=ProjectLog.LogType.refund,
            title="다른 공장 반품 로그",
            content="격리 검사",
            refund=refund,
        )
        work_instruction = WorkInstruction.objects.create(factory=other_factory)
        WorkInstructionHistory.objects.create(
            work_instruction=work_instruction,
            action=WorkInstructionHistory.ActionType.added,
        )

        factory_id = self.factory.id
        hidden_object_paths = [
            f"/v1/stock/material/{material.id}?factory_id={factory_id}",
            f"/v1/stock/material-history?material_id={material.id}&factory_id={factory_id}",
            f"/v2/stock/material-history/available-lots?material_id={material.id}&factory_id={factory_id}",
            f"/v2/stock/material-history/{material_history.id}?factory_id={factory_id}",
            f"/v2/repackaging?material_id={material.id}&factory_id={factory_id}",
            f"/v2/repackaging/{repackaging.id}?factory_id={factory_id}",
            f"/v1/stock/product/{product.id}?factory_id={factory_id}",
            f"/v1/stock/product/history/{product_history.id}?factory_id={factory_id}",
            f"/v2/unit-conversion/material/{material.id}?factory_id={factory_id}",
            f"/v2/unit-conversion/product/{product.id}?factory_id={factory_id}",
            f"/v1/project-plan?project_id={project.id}&factory_id={factory_id}",
            f"/v1/document/work-instruction/{work_instruction.id}/history?factory_id={factory_id}",
            f"/v1/project-log?project_id={project.id}&factory_id={factory_id}",
            f"/v1/project-refund/{refund.id}?factory_id={factory_id}",
        ]

        for path in hidden_object_paths:
            with self.subTest(path=path):
                response = self.client.get(path, **self.headers)
                self.assertIn(
                    response.status_code,
                    {200, 403, 404},
                    f"{path}: {response.content.decode()}",
                )
                self.assertNotIn(
                    "다른 공장",
                    response.content.decode(),
                    f"다른 공장 데이터 노출: {path}",
                )
                if response.status_code == 200:
                    body = response.json()
                    data = body.get("data", []) if isinstance(body, dict) else body
                    self.assertEqual(data, [])
