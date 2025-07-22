from django.test import TestCase
from user.api import router as user_router
from factory.api_member import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryMember
from asgiref.sync import sync_to_async
from datetime import datetime, timezone


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

    async def test_invite_factory_member_already_registered(self):
        """
        이미 가입된 이메일로 초대 시 400 에러와 명확한 메시지 반환 테스트
        """
        headers = await self.authenticate()
        # 이미 가입된 유저(본인 또는 다른 유저)로 초대 시도
        payload = {
            "factory_id": self.factory.id,
            "email": self.user.email,  # 이미 가입된 이메일
            "role": "member",
        }
        response = await self.client.post("/invite", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("이미 해당 유저는 팩토리 멤버입니다.", data.get("detail", ""))

    async def test_list_factory_members_with_inviting(self):
        """
        전체 멤버 조회 시 가입된 멤버와 미가입 초대자가 모두 반환되는지 테스트
        """
        headers = await self.authenticate()
        # 미가입 초대자 추가
        invited_email = "invitee2@example.com"
        invited_at = datetime.now(timezone.utc).isoformat()
        self.factory.inviting = [{
            "email": invited_email,
            "role": "member",
            "invited_by": self.user.id,
            "invited_at": invited_at
        }]
        await sync_to_async(self.factory.save)()
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        # 가입된 멤버와 미가입 초대자가 모두 포함되어야 함
        emails = [item["email"] for item in data["data"]]
        self.assertIn(self.user.email, emails)  # 가입된 멤버
        self.assertIn(invited_email, emails)    # 미가입 초대자
        # 미가입 초대자 정보 검증
        invited = next(item for item in data["data"] if item["email"] == invited_email)
        self.assertIsNone(invited["user"])
        self.assertEqual(invited["status"], "invited")
        self.assertEqual(invited["invited_at"].replace("+00:00", "Z")[:19], invited_at.replace("+00:00", "Z")[:19])
        self.assertLess(invited["id"], 0)  # 음수 id
        self.assertEqual(invited["name"], "")

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
