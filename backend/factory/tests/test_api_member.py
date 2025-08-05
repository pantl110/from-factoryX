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
        # 테스트용 공장 멤버 등록 - 명시적으로 active 상태로 설정
        self.member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role="admin",
            status="active",  # 명시적으로 active 상태로 설정
            invited_by=self.user,
        )

    async def authenticate(self):
        import jwt
        from django.conf import settings
        from django.utils import timezone
        from datetime import timedelta
        
        # 직접 JWT 토큰 생성
        payload = {
            'user_id': self.user.id,
            'exp': timezone.now() + timedelta(hours=1)
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        return {
            "Authorization": f"Bearer {token}",
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
        response = await self.client.post(f"/invite?factory_id={self.factory.id}", headers=headers, json=payload)
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
        response = await self.client.post(f"/invite?factory_id={self.factory.id}", headers=headers, json=payload)
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
        self.assertEqual(invited["id"], 0)  # 초대 대기자는 0부터 시작
        self.assertEqual(invited["name"], "")

    async def test_update_factory_member(self):
        """
        멤버 정보 수정 테스트
        """
        headers = await self.authenticate()
        
        # 먼저 멤버 목록을 조회하여 올바른 ID를 확인
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 기존 멤버의 ID 찾기 (1000+)
        existing_member = next(item for item in data["data"] if item["user"] == self.user.id)
        member_api_id = existing_member["id"]
        
        payload = {
            "role": "member"
        }
        response = await self.client.patch(f"/{member_api_id}?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], member_api_id)
        self.assertEqual(data["role"], "member")
        self.assertEqual(data["factory"], self.factory.id)
        self.assertEqual(data["user"], self.user.id)
        self.assertEqual(set(data.keys()), {"id", "factory", "user", "role"})

    async def test_update_inviting_member(self):
        """
        초대 대기자(미가입) 권한 수정 테스트
        """
        headers = await self.authenticate()
        invited_email = "invitee3@example.com"
        self.factory.inviting = [{
            "email": invited_email,
            "role": "viewer",
            "invited_by": self.user.id,
            "invited_at": datetime.now(timezone.utc).isoformat()
        }]
        await sync_to_async(self.factory.save)()
        # inviting[0]의 id는 0
        payload = {"role": "manager"}
        response = await self.client.patch(f"/0?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], 0)
        self.assertEqual(data["factory"], self.factory.id)
        self.assertIsNone(data["user"])
        self.assertEqual(data["role"], "manager")
        self.assertEqual(set(data.keys()), {"id", "factory", "user", "role"})
        # 실제 inviting 배열도 변경되었는지 확인
        await sync_to_async(self.factory.refresh_from_db)()
        self.assertEqual(self.factory.inviting[0]["role"], "manager")

    async def test_delete_factory_member(self):
        """
        멤버 삭제 테스트
        """
        headers = await self.authenticate()
        
        # 먼저 멤버 목록을 조회하여 올바른 ID를 확인
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 기존 멤버의 ID 찾기 (1000+)
        existing_member = next(item for item in data["data"] if item["user"] == self.user.id)
        member_api_id = existing_member["id"]
        
        response = await self.client.delete(f"/{member_api_id}?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("deleted_member_id", data)
        self.assertEqual(data["deleted_member_id"], member_api_id)

    async def test_multiple_inviting_members(self):
        """
        여러 초대 대기자가 있는 경우 ID 할당 테스트
        """
        headers = await self.authenticate()
        # 여러 미가입 초대자 추가
        self.factory.inviting = [
            {
                "email": "invitee5@example.com",
                "role": "member",
                "invited_by": self.user.id,
                "invited_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "email": "invitee6@example.com",
                "role": "viewer",
                "invited_by": self.user.id,
                "invited_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "email": "invitee7@example.com",
                "role": "manager",
                "invited_by": self.user.id,
                "invited_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await sync_to_async(self.factory.save)()
        
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 초대 대기자들의 ID가 0, 1, 2로 할당되었는지 확인
        inviting_members = [item for item in data["data"] if item["user"] is None]
        self.assertEqual(len(inviting_members), 3)
        
        inviting_ids = [item["id"] for item in inviting_members]
        self.assertEqual(inviting_ids, [0, 1, 2])
        
        # 기존 멤버의 ID는 실제 DB ID (보통 1, 2, 3...)
        existing_members = [item for item in data["data"] if item["user"] is not None]
        for member in existing_members:
            self.assertIsNotNone(member["user"])
            self.assertNotEqual(member["name"], "")

    async def test_delete_inviting_member(self):
        """
        초대 대기자(미가입) 삭제 테스트
        """
        headers = await self.authenticate()
        invited_email = "invitee4@example.com"
        self.factory.inviting = [{
            "email": invited_email,
            "role": "viewer",
            "invited_by": self.user.id,
            "invited_at": datetime.now(timezone.utc).isoformat()
        }]
        await sync_to_async(self.factory.save)()
        # inviting[0]의 id는 0
        response = await self.client.delete(f"/0?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("deleted_member_id", data)
        self.assertEqual(data["deleted_member_id"], 0)
        # 실제 inviting 배열도 변경되었는지 확인
        await sync_to_async(self.factory.refresh_from_db)()
        self.assertEqual(len(self.factory.inviting), 0)

    async def test_id_distinction_between_members_and_inviting(self):
        """
        기존 멤버와 초대 대기자의 ID 구분 테스트
        """
        headers = await self.authenticate()
        
        # 기존 멤버 추가
        new_user = await sync_to_async(User.objects.create_user)(
            username="newuser",
            password="password1234!",
            email="newuser@example.com",
        )
        new_member = await sync_to_async(FactoryMember.objects.create)(
            factory=self.factory,
            user=new_user,
            role="member",
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )
        
        # 초대 대기자 추가
        self.factory.inviting = [
            {
                "email": "invitee8@example.com",
                "role": "viewer",
                "invited_by": self.user.id,
                "invited_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await sync_to_async(self.factory.save)()
        
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 기존 멤버들의 ID는 실제 DB ID (보통 1, 2, 3...)
        existing_members = [item for item in data["data"] if item["user"] is not None]
        for member in existing_members:
            self.assertIsNotNone(member["user"])
            self.assertNotEqual(member["name"], "")
        
        # 초대 대기자들의 ID는 0~999
        inviting_members = [item for item in data["data"] if item["user"] is None]
        for member in inviting_members:
            self.assertLess(member["id"], 1000)
            self.assertGreaterEqual(member["id"], 0)
            self.assertIsNone(member["user"])
            self.assertEqual(member["name"], "")
            self.assertEqual(member["status"], "invited")
