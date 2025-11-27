from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryEquipment, FactoryMember
from project.models import Project, ProjectPlan, ProjectPlanMaterialUsage
from document.models import Quotation, QuotationProduct
from stock.models import Product, Material, MaterialHistory
import json
import jwt
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal

User = get_user_model()


class ProjectPlanMaterialUsageAPITestCase(TestCase):
    """프로젝트 플랜 자재 사용 내역 API 테스트"""

    def setUp(self):
        from dateutil.relativedelta import relativedelta

        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.factory = Factory.objects.create(name="테스트 공장", owner=self.user)
        self.client_company = FactoryClient.objects.create(
            factory=self.factory, name="테스트 고객사", business_registration_number="123-45-67890"
        )
        self.equipment = FactoryEquipment.objects.create(
            factory=self.factory, name="테스트 설비", priority=1
        )
        self.product = Product.objects.create(
            factory=self.factory, name="테스트 제품", code="TEST001", unit="개"
        )
        self.material = Material.objects.create(
            factory=self.factory, name="테스트 자재", code="MAT001", unit="kg", current_stock=100
        )

        self.project = Project.objects.create()
        self.quotation = Quotation.objects.create(
            factory=self.factory, client=self.client_company, project=self.project
        )
        self.quotation_product = QuotationProduct.objects.create(
            quotation=self.quotation, product=self.product, quantity=100, unit_price=1000
        )
        self.plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            quantity=100,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            avg_production_time=3600,
        )
        self.material_history = MaterialHistory.objects.create(
            material=self.material,
            client=self.client_company,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=100,
            price=1000,
            lot_number="LOT-2024-001",
            total_stock=100,
            remaining_quantity=50,
        )

        one_month_ago = timezone.now() - relativedelta(months=1)
        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )
        FactoryMember.objects.filter(factory=self.factory).update(created_at=one_month_ago)

        self.token = jwt.encode(
            {"user_id": self.user.id, "exp": timezone.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )
        self.headers = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

    def _get(self, plan_id=None, factory_id=None):
        plan_id = plan_id or self.plan.id
        factory_id = factory_id or self.factory.id
        url = f"/v2/material-usage?factory_id={factory_id}&plan_id={plan_id}"
        return self.client.get(url, **self.headers)

    def _post(self, payload, factory_id=None):
        factory_id = factory_id or self.factory.id
        url = f"/v2/material-usage?factory_id={factory_id}"
        return self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            **self.headers,
        )

    def test_list_success(self):
        """자재 사용 내역 조회 성공"""
        usage = ProjectPlanMaterialUsage.objects.create(
            plan=self.plan,
            material=self.material,
            original_material=self.material,
            usage_amount=Decimal("100.50"),
            material_history=self.material_history,
        )

        response = self._get()
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], usage.id)

    def test_list_multiple(self):
        """여러 자재 사용 내역 조회"""
        ProjectPlanMaterialUsage.objects.create(
            plan=self.plan,
            material=self.material,
            original_material=self.material,
            usage_amount=Decimal("50.25"),
            material_history=self.material_history,
        )
        material2 = Material.objects.create(
            factory=self.factory, name="테스트 자재 2", code="MAT003", unit="개", current_stock=200
        )
        history2 = MaterialHistory.objects.create(
            material=material2,
            client=self.client_company,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=200,
            price=2000,
            lot_number="LOT-2024-002",
            total_stock=200,
            remaining_quantity=150,
        )
        usage2 = ProjectPlanMaterialUsage.objects.create(
            plan=self.plan,
            material=material2,
            original_material=material2,
            usage_amount=Decimal("75.75"),
            material_history=history2,
        )

        response = self._get()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)
        self.assertEqual(response.json()[0]["id"], usage2.id)

    def test_list_empty(self):
        """자재 사용 내역 없음"""
        response = self._get()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_list_nonexistent_plan(self):
        """존재하지 않는 플랜"""
        response = self._get(plan_id=99999)
        self.assertEqual(response.status_code, 404)

    def test_list_wrong_factory(self):
        """다른 공장의 플랜 조회"""
        from dateutil.relativedelta import relativedelta

        other_factory = Factory.objects.create(name="다른 공장", owner=self.user)
        one_month_ago = timezone.now() - relativedelta(months=1)
        FactoryMember.objects.create(
            factory=other_factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )
        FactoryMember.objects.filter(factory=other_factory).update(created_at=one_month_ago)

        response = self._get(factory_id=other_factory.id)
        self.assertEqual(response.status_code, 403)

    def test_list_without_factory_id(self):
        """factory_id 없이 조회"""
        url = f"/v2/material-usage?plan_id={self.plan.id}"
        response = self.client.get(url, **self.headers)
        self.assertEqual(response.status_code, 400)

    def test_list_with_repackaging(self):
        """MaterialRepackaging 사용 내역 조회"""
        from repackaging.models import MaterialRepackaging

        repackaging = MaterialRepackaging.objects.create(
            parent_history=self.material_history, lot_number="LOT-2024-001-01", quantity=30
        )
        ProjectPlanMaterialUsage.objects.create(
            plan=self.plan,
            material=self.material,
            original_material=self.material,
            usage_amount=Decimal("25.00"),
            material_repackaging=repackaging,
        )

        response = self._get()
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["material_repackaging_id"], repackaging.id)
        self.assertIsNone(data[0]["material_history_id"])

    def test_create_material_usages_success(self):
        """자재 사용 내역 생성 성공"""
        payload = [
            {
                "plan_id": self.plan.id,
                "material_id": self.material.id,
                "usage_amount": "100.50",
                "material_history_id": self.material_history.id,
            }
        ]

        response = self._post(payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["plan_id"], self.plan.id)
        self.assertEqual(data[0]["material_id"], self.material.id)
        self.assertEqual(str(data[0]["usage_amount"]), "100.50")

    def test_update_material_usage_success(self):
        """자재 사용 내역 수정 성공"""
        usage = ProjectPlanMaterialUsage.objects.create(
            plan=self.plan,
            material=self.material,
            original_material=self.material,
            usage_amount=Decimal("50.00"),
            material_history=self.material_history,
        )

        payload = [
            {
                "id": usage.id,
                "usage_amount": "75.25",
            }
        ]

        response = self._post(payload)
        self.assertEqual(response.status_code, 200)
        usage.refresh_from_db()
        self.assertEqual(usage.usage_amount, Decimal("75.25"))

    def test_delete_material_usage_success(self):
        """자재 사용 내역 삭제 성공"""
        usage = ProjectPlanMaterialUsage.objects.create(
            plan=self.plan,
            material=self.material,
            original_material=self.material,
            usage_amount=Decimal("10.00"),
            material_history=self.material_history,
        )

        url = f"/v2/material-usage/{usage.id}?factory_id={self.factory.id}"
        response = self.client.delete(url, **self.headers)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            ProjectPlanMaterialUsage.objects.filter(id=usage.id).exists()
        )

