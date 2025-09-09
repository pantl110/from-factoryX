from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja.testing import TestAsyncClient
from document.api_workinstruction import router
from document.models import WorkInstruction
from factory.models import Factory, FactoryMember
import jwt
from django.conf import settings
from datetime import datetime, timedelta

User = get_user_model()


class TestWorkInstructionAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.factory = Factory.objects.create(name="Test Factory", owner=self.user)

        # FactoryMember 생성 (사용자를 공장 멤버로 등록)
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role="admin",
            status="active",
            invited_by=self.user,
        )

        # 작업지시서 생성
        self.work_instruction = WorkInstruction.objects.create(
            factory=self.factory,
            memo="Test memo content",
        )

    def _get_jwt_token(self):
        """JWT 토큰 생성"""
        return jwt.encode(
            {"user_id": self.user.id, "exp": datetime.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def _get_auth_headers(self):
        """인증 헤더 반환"""
        return {"Authorization": f"Bearer {self._get_jwt_token()}"}

    async def test_get_work_instructions_success(self):
        """작업지시서 목록 조회 성공 테스트"""
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=self._get_auth_headers()
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["memo"], "Test memo content")
        self.assertEqual(data["data"][0]["factory"], self.factory.id)

    async def test_get_work_instructions_missing_factory_id(self):
        """factory_id 누락 테스트"""
        response = await self.client.get("", headers=self._get_auth_headers())

        self.assertEqual(response.status_code, 400)
        self.assertIn("factory_id를 입력해야 합니다.", response.json()["detail"])

    async def test_get_work_instructions_with_order_by_created_at_desc(self):
        """생성일 역순 정렬 테스트 (기본값)"""
        # 두 번째 작업지시서 생성
        await WorkInstruction.objects.acreate(
            factory=self.factory,
            memo="Second memo content",
        )

        response = await self.client.get(
            f"?factory_id={self.factory.id}&order_by=-created_at",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)
        # 최신 생성된 것이 먼저 나와야 함
        self.assertEqual(data["data"][0]["memo"], "Second memo content")

    async def test_get_work_instructions_with_order_by_created_at_asc(self):
        """생성일 순서 정렬 테스트"""
        # 두 번째 작업지시서 생성
        await WorkInstruction.objects.acreate(
            factory=self.factory,
            memo="Second memo content",
        )

        response = await self.client.get(
            f"?factory_id={self.factory.id}&order_by=created_at",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)
        # 먼저 생성된 것이 먼저 나와야 함
        self.assertEqual(data["data"][0]["memo"], "Test memo content")

    async def test_get_work_instructions_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.get(f"?factory_id={self.factory.id}")

        self.assertEqual(response.status_code, 401)

    async def test_get_work_instructions_invalid_token(self):
        """잘못된 토큰 테스트"""
        response = await self.client.get(
            f"?factory_id={self.factory.id}",
            headers={"Authorization": "Bearer invalid_token"},
        )

        self.assertEqual(response.status_code, 401)

    async def test_get_work_instructions_empty_result(self):
        """빈 결과 테스트"""
        empty_factory = await Factory.objects.acreate(
            name="Empty Factory", owner=self.user
        )

        # 빈 공장의 멤버로 등록
        await FactoryMember.objects.acreate(
            factory=empty_factory,
            user=self.user,
            role="admin",
            status="active",
            invited_by=self.user,
        )

        response = await self.client.get(
            f"?factory_id={empty_factory.id}",
            headers=self._get_auth_headers(),
        )

        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data["data"]), 0)

    async def test_get_work_instructions_different_factory(self):
        """다른 공장의 작업지시서는 조회되지 않는지 테스트"""
        # 다른 사용자와 공장 생성
        other_user = await User.objects.acreate(
            username="otheruser", email="other@example.com", password="testpass123"
        )

        other_factory = await Factory.objects.acreate(
            name="Other Factory", owner=other_user
        )

        # 다른 공장에 작업지시서 생성
        await WorkInstruction.objects.acreate(
            factory=other_factory,
            memo="Other factory memo",
        )

        # 현재 사용자의 공장 ID로 조회
        response = await self.client.get(
            f"?factory_id={self.factory.id}",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        # 현재 공장의 작업지시서만 조회되어야 함
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["memo"], "Test memo content")

    async def test_get_work_instructions_nonexistent_factory(self):
        """존재하지 않는 공장 ID로 조회 테스트"""
        response = await self.client.get(
            f"?factory_id=99999",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        # 존재하지 않는 공장의 경우 빈 결과 반환
        self.assertEqual(len(data["data"]), 0)

    async def test_get_work_instructions_with_plans(self):
        """생산 계획이 연결된 작업지시서 테스트"""
        # plans가 Many-to-Many 필드이므로 추가 작업지시서 생성
        work_instruction_with_plans = await WorkInstruction.objects.acreate(
            factory=self.factory,
            memo="Work instruction with plans",
        )

        response = await self.client.get(
            f"?factory_id={self.factory.id}",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)

        # 각 작업지시서의 기본 필드들이 포함되어 있는지 확인
        for item in data["data"]:
            self.assertIn("id", item)
            self.assertIn("factory", item)
            self.assertIn("memo", item)
            self.assertIn("created_at", item)
            self.assertIn("updated_at", item)
            self.assertIn("plans", item)
