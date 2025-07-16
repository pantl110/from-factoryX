from django.test import TestCase
from user.api import router as user_router
from factory.api_member import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryMember
from asgiref.sync import sync_to_async


class TestFactoryMember(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.auth_client = TestAsyncClient(user_router)
        self.user = User.objects.create_user(
            username="testuser",
            password="password1234!",
            email="testuser@example.com",
        )
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Test Factory",
            business_registration_number="123-45-67890",
        )
        self.member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role="admin",
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )

    async def authenticate(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        return {
            "Authorization": f"Bearer {data['access_token']}",
        }

    async def test_invite_factory_member(self):
        """
        팩토리 멤버 초대 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "email": "invitee@example.com",
            "role": "member",
        }
        response = await self.client.post("/invite", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("초대", data["message"])  # 초대 메일 발송 메시지 확인

    async def test_list_factory_members(self):
        """
        전체 멤버 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # 페이지네이션된 응답 확인
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertGreaterEqual(len(data["data"]), 1)
        # user 필드가 ID로 반환되는지 확인
        self.assertEqual(data["data"][0]["user"], self.user.id)

    async def test_list_inviting_members(self):
        """
        내가 초대한(미가입) 멤버 조회 테스트
        """
        headers = await self.authenticate()
        # 초대 먼저 진행
        payload = {
            "factory_id": self.factory.id,
            "email": "invitee2@example.com",
            "role": "member",
        }
        await self.client.post("/invite", headers=headers, json=payload)
        response = await self.client.get(f"/invited?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("inviting", data)
        self.assertTrue(any(item["email"] == "invitee2@example.com" for item in data["inviting"]))

    async def test_update_factory_member(self):
        """
        멤버 정보 수정 테스트
        """
        headers = await self.authenticate()
        payload = {
            "role": "member",
            "status": FactoryMember.MemberStatus.active,
        }
        response = await self.client.patch(f"/{self.member.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.member.id)
        self.assertEqual(data["role"], "member")
        self.assertEqual(data["status"], FactoryMember.MemberStatus.active)

    async def test_delete_factory_member(self):
        """
        멤버 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(f"/{self.member.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("deleted_member_id", data)
        self.assertEqual(data["deleted_member_id"], self.member.id)

    async def test_delete_factory_member_not_found(self):
        """
        존재하지 않는 멤버 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete("/99999", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_update_factory_member_not_found(self):
        """
        존재하지 않는 멤버 수정 테스트
        """
        headers = await self.authenticate()
        payload = {"role": "member"}
        response = await self.client.patch("/99999", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)
