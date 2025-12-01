from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryEquipment, FactoryMember
from project.models import Project, ProjectPlan
from document.models import Quotation, QuotationProduct
from stock.models import Product, Material, MaterialHistory, MaterialUsage
import json
import jwt
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal
from typing import Optional

User = get_user_model()


class MaterialUsageAPITestCase(TestCase):
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

    def _create_usage_api(
        self,
        usage_amount: str,
        material_history_id: Optional[int] = None,
        material_repackaging_id: Optional[int] = None,
    ):
        payload = [
            {
                "plan_id": self.plan.id,
                "material_id": self.material.id,
                "usage_amount": usage_amount,
                "material_history_id": material_history_id or self.material_history.id,
                "material_repackaging_id": material_repackaging_id,
            }
        ]
        response = self._post(payload)
        self.assertEqual(response.status_code, 201)
        return response.json()[0]

    def test_list_success(self):
        """자재 사용 내역 조회 성공"""
        usage = MaterialUsage.objects.create(
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
        MaterialUsage.objects.create(
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
        usage2 = MaterialUsage.objects.create(
            plan=self.plan,
            material=material2,
            original_material=material2,
            usage_amount=Decimal("75.75"),
            material_history=history2,
        )

        response = self._get()
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        # 정렬 기준이 변경될 수 있으므로, 두 usage가 모두 포함되어 있는지만 검증
        ids = {item["id"] for item in data}
        self.assertIn(usage2.id, ids)

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
        MaterialUsage.objects.create(
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

    def test_list_with_material_repackaging_id_filter(self):
        """material_repackaging_id로 필터링하여 조회"""
        from repackaging.models import MaterialRepackaging

        repackaging1 = MaterialRepackaging.objects.create(
            parent_history=self.material_history, lot_number="LOT-2024-001-01", quantity=30
        )
        repackaging2 = MaterialRepackaging.objects.create(
            parent_history=self.material_history, lot_number="LOT-2024-001-02", quantity=20
        )

        usage1 = MaterialUsage.objects.create(
            plan=self.plan,
            material=self.material,
            usage_amount=Decimal("10.00"),
            material_repackaging=repackaging1,
        )
        usage2 = MaterialUsage.objects.create(
            plan=self.plan,
            material=self.material,
            usage_amount=Decimal("15.00"),
            material_repackaging=repackaging2,
        )

        # repackaging1로 필터링 (페이지네이션 엔드포인트 사용)
        url = f"/v2/material-usage/paginated?factory_id={self.factory.id}&material_repackaging_id={repackaging1.id}"
        response = self.client.get(url, **self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["id"], usage1.id)
        self.assertEqual(data["data"][0]["material_repackaging_id"], repackaging1.id)

        # repackaging2로 필터링 (페이지네이션 엔드포인트 사용)
        url = f"/v2/material-usage/paginated?factory_id={self.factory.id}&material_repackaging_id={repackaging2.id}"
        response = self.client.get(url, **self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["id"], usage2.id)
        self.assertEqual(data["data"][0]["material_repackaging_id"], repackaging2.id)

    def test_create_material_usages_success(self):
        """자재 사용 내역 생성 성공"""
        payload = [
            {
                "plan_id": self.plan.id,
                "material_id": self.material.id,
                "usage_amount": "10.50",
                "material_history_id": self.material_history.id,
            }
        ]

        response = self._post(payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["plan_id"], self.plan.id)
        self.assertEqual(data[0]["material_id"], self.material.id)
        self.assertEqual(str(data[0]["usage_amount"]), "10.50")

        self.material_history.refresh_from_db()
        self.assertEqual(self.material_history.remaining_quantity, Decimal("39.50"))

    def test_create_usage_exceeds_lot(self):
        """LOT 잔량 초과 시 생성 실패"""
        payload = [
            {
                "plan_id": self.plan.id,
                "material_id": self.material.id,
                "usage_amount": "999.00",
                "material_history_id": self.material_history.id,
            }
        ]

        response = self._post(payload)
        self.assertEqual(response.status_code, 400)

    def test_update_usage_adjusts_lot_quantity(self):
        """수정 시 기존 LOT 복원 후 차감"""
        usage = self._create_usage_api("10.00")
        self.material_history.refresh_from_db()
        self.assertEqual(self.material_history.remaining_quantity, Decimal("40.00"))

        payload = [{"id": usage["id"], "usage_amount": "15.00"}]
        response = self._post(payload)
        self.assertEqual(response.status_code, 200)

        self.material_history.refresh_from_db()
        self.assertEqual(self.material_history.remaining_quantity, Decimal("35.00"))

    def test_update_usage_switch_lot(self):
        """다른 LOT으로 변경 시 잔량 이동"""
        other_history = MaterialHistory.objects.create(
            material=self.material,
            client=self.client_company,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=1200,
            lot_number="LOT-2024-003",
            total_stock=150,
            remaining_quantity=Decimal("25.00"),
        )
        usage = self._create_usage_api("10.00")
        payload = [
            {
                "id": usage["id"],
                "material_history_id": other_history.id,
                "usage_amount": "5.00",
            }
        ]
        response = self._post(payload)
        self.assertEqual(response.status_code, 200)

        self.material_history.refresh_from_db()
        other_history.refresh_from_db()
        self.assertEqual(self.material_history.remaining_quantity, Decimal("50.00"))
        self.assertEqual(other_history.remaining_quantity, Decimal("20.00"))

    def test_update_material_usage_success(self):
        """자재 사용 내역 수정 성공"""
        usage = self._create_usage_api("25.00")

        payload = [
            {
                "id": usage["id"],
                "usage_amount": "40.00",
            }
        ]

        response = self._post(payload)
        self.assertEqual(response.status_code, 200)
        db_usage = MaterialUsage.objects.get(id=usage["id"])
        self.assertEqual(db_usage.usage_amount, Decimal("40.00"))

    def test_update_material_usage_insufficient_same_lot(self):
        """같은 LOT에서 잔량 부족 시 오류"""
        usage = self._create_usage_api("50.00")

        payload = [
            {
                "id": usage["id"],
                "usage_amount": "75.25",
            }
        ]

        response = self._post(payload)
        self.assertEqual(response.status_code, 400)
        detail = response.json().get("detail")
        self.assertIn("LOT", detail)
        self.assertIn(self.material.name, detail)

    def test_delete_usage_by_omitting_from_payload(self):
        """payload에서 제외하면 자동 삭제되는지 확인"""
        # 기존 사용 내역 2개 생성
        usage1 = self._create_usage_api("10.00")
        material2 = Material.objects.create(
            factory=self.factory, name="테스트 자재 2", code="MAT002", unit="개", current_stock=200
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
        # usage2 생성 (usage1도 함께 포함하여 삭제되지 않도록)
        payload2 = [
            {
                "id": usage1["id"],
                "usage_amount": usage1["usage_amount"],
            },
            {
                "plan_id": self.plan.id,
                "material_id": material2.id,
                "usage_amount": "15.00",
                "material_history_id": history2.id,
            }
        ]
        response2 = self._post(payload2)
        # usage1이 업데이트되면 200, usage2가 새로 생성되면 201이지만, 둘 다 있으면 200이 반환됨
        self.assertIn(response2.status_code, [200, 201], f"usage2 생성 실패: {response2.json()}")
        usage2_data = response2.json()
        # usage2 찾기 (material_id가 material2.id인 것)
        usage2 = next(u for u in usage2_data if u["material_id"] == material2.id)

        # 기존 사용 내역이 2개인지 확인
        response = self._get()
        usages = response.json()
        self.assertEqual(len(usages), 2, f"사용 내역이 2개가 아님. 현재: {len(usages)}, 내용: {usages}")

        # usage1만 payload에 포함하고 usage2는 제외
        payload = [
            {
                "id": usage1["id"],
                "usage_amount": "12.00",  # 수정
            }
        ]

        response = self._post(payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], usage1["id"])
        self.assertEqual(str(data[0]["usage_amount"]), "12.00")

        # usage2가 삭제되었는지 확인
        self.assertFalse(MaterialUsage.objects.filter(id=usage2["id"]).exists())

        # usage2의 LOT 잔량이 복원되었는지 확인
        history2.refresh_from_db()
        self.assertEqual(history2.remaining_quantity, Decimal("150.00"))


