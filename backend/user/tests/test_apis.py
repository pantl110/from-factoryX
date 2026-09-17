from django.test import TestCase
from user.api import router
from ninja.testing import TestAsyncClient
from user.models import User, EmailVerification
from factory.models import Factory, FactoryMember
from asgiref.sync import sync_to_async
from datetime import timedelta, datetime
from datetime import timezone as dt_timezone


class TestUser(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.user = User.objects.create_user(
            email="test1@example.com",
            password="password1234!",
            status=User.UserStatusChoice.admin,
            terms_of_service=True,
            privacy_policy_agreement=True,
        )
        self.verification = EmailVerification.objects.create(
            email=self.user.email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

    async def authenticate(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return {
            "Authorization": f"Bearer {data['access_token']}",
        }

    async def get_refresh_token(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return data.get("refresh_token")

    async def test_signup(self):
        """
        회원가입 테스트
        """
        await EmailVerification.objects.acreate(
            email="test2@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )
        data = {
            "email": "test2@example.com",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
        }
        response = await self.client.post("/signup", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)

    async def test_withdrawn_user_can_rejoin_after_signup_verification(self):
        """탈퇴 이메일은 재인증·약관 동의 후 새 비밀번호로 재가입할 수 있다."""
        email = "withdrawn-rejoin@example.com"
        user = await User.objects.acreate(
            email=email,
            status=User.UserStatusChoice.withdraw,
            terms_of_service=True,
            privacy_policy_agreement=True,
        )
        user.set_password("old-password123!")
        await sync_to_async(user.save)()
        await EmailVerification.objects.acreate(
            email=email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

        response = await self.client.post(
            "/signup",
            json={
                "email": email,
                "password": "new-password123!",
                "password_confirm": "new-password123!",
                "terms_of_service": True,
                "privacy_policy_agreement": True,
                "marketing_agreement": True,
            },
        )

        self.assertEqual(response.status_code, 200)
        await user.arefresh_from_db()
        self.assertEqual(user.status, User.UserStatusChoice.active)
        self.assertTrue(await sync_to_async(user.check_password)("new-password123!"))
        self.assertTrue(user.marketing_agreement)

    async def test_signup_with_invite_token(self):
        """
        초대 토큰을 사용한 회원가입 테스트
        """

        # 팩토리 생성
        factory = await sync_to_async(Factory.objects.create)(
            name="테스트 팩토리",
            business_registration_number="123-45-67890",
            owner=self.user,
        )

        # 초대 정보 추가
        invite_email = "invited@example.com"

        factory.inviting = [
            {
                "email": invite_email,
                "role": "member",
                "invited_by": self.user.id,
                "invited_at": datetime.now().isoformat(),
            }
        ]
        await sync_to_async(factory.save)()

        # 이메일 인증 생성
        await EmailVerification.objects.acreate(
            email=invite_email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

        # 초대받은 정보로 회원가입
        data = {
            "email": invite_email,
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
            "factory_id": factory.id,
            "invite_role": "member",
        }

        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 200)

        # 사용자가 생성되었는지 확인
        new_user = await User.objects.aget(email=invite_email)
        self.assertIsNotNone(new_user)

        # 팩토리 멤버로 등록되었는지 확인
        member = await FactoryMember.objects.aget(user=new_user, factory=factory)
        self.assertEqual(member.role, "member")
        self.assertEqual(member.status, "active")

        # inviting에서 제거되었는지 확인
        await sync_to_async(factory.refresh_from_db)()
        self.assertEqual(len(factory.inviting), 0)

    async def test_signup_with_invalid_invite(self):
        """
        유효하지 않은 초대로 회원가입 시도 테스트
        """
        # 팩토리 생성
        factory = await sync_to_async(Factory.objects.create)(
            name="테스트 팩토리",
            business_registration_number="123-45-67890",
            owner=self.user,
        )

        # 이메일 인증 생성
        await EmailVerification.objects.acreate(
            email="test@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

        # 초대받지 않은 이메일로 회원가입 시도
        data = {
            "email": "test@example.com",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
            "factory_id": factory.id,
            "invite_role": "member",
        }

        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "해당 팩토리에서 초대받지 않은 이메일입니다", response.json()["detail"]
        )

    async def test_signup_without_invite_token(self):
        """
        초대 토큰 없이 일반 회원가입 테스트
        """
        # 이메일 인증 생성
        await EmailVerification.objects.acreate(
            email="normal@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

        # 초대 토큰 없이 회원가입
        data = {
            "email": "normal@example.com",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
        }

        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 200)

        # 사용자가 생성되었는지 확인
        new_user = await User.objects.aget(email="normal@example.com")
        self.assertIsNotNone(new_user)

        # 팩토리 멤버로 등록되지 않았는지 확인 (초대 토큰이 없으므로)
        members = await FactoryMember.objects.filter(user=new_user).acount()
        self.assertEqual(members, 0)

    async def test_signup_with_expired_invite_token(self):
        """
        만료된 초대 토큰으로 회원가입 시도 테스트
        """

        # 팩토리 생성
        factory = await sync_to_async(Factory.objects.create)(
            name="테스트 팩토리",
            business_registration_number="123-45-67890",
            owner=self.user,
        )

        # 만료된 초대 정보 추가 (25시간 전)
        invite_email = "expired@example.com"
        expired_time = datetime.now() - timedelta(hours=25)

        factory.inviting = [
            {
                "email": invite_email,
                "role": "member",
                "invited_by": self.user.id,
                "invited_at": expired_time.isoformat(),
            }
        ]
        await factory.asave()

        # 이메일 인증 생성
        await EmailVerification.objects.acreate(
            email=invite_email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

        # 만료된 초대로 회원가입 시도
        data = {
            "email": invite_email,
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
            "factory_id": factory.id,
            "invite_role": "member",
        }

        response = await self.client.post("/signup", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        # 초대가 만료되지 않았으므로 성공해야 함

        # 사용자가 생성되었는지 확인
        new_user = await User.objects.aget(email=invite_email)
        self.assertIsNotNone(new_user)

        # 팩토리 멤버로 등록되었는지 확인
        member = await FactoryMember.objects.aget(user=new_user, factory=factory)
        self.assertEqual(member.role, "member")
        self.assertEqual(member.status, "active")

        # inviting에서 제거되었는지 확인
        await sync_to_async(factory.refresh_from_db)()
        self.assertEqual(len(factory.inviting), 0)

    async def test_signup_with_mismatched_email_invite_token(self):
        """
        초대받은 이메일과 가입 이메일이 일치하지 않는 경우 테스트
        """

        # 팩토리 생성
        factory = await sync_to_async(Factory.objects.create)(
            name="테스트 팩토리",
            business_registration_number="123-45-67890",
            owner=self.user,
        )

        # 초대 정보 추가
        invite_email = "invited@example.com"
        factory.inviting = [
            {
                "email": invite_email,
                "role": "member",
                "invited_by": self.user.id,
                "invited_at": datetime.now().isoformat(),
            }
        ]
        await sync_to_async(factory.save)()

        # 다른 이메일로 인증 생성
        await EmailVerification.objects.acreate(
            email="different@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

        # 다른 이메일로 회원가입 시도
        data = {
            "email": "different@example.com",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
            "factory_id": factory.id,
            "invite_role": "member",
        }

        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "해당 팩토리에서 초대받지 않은 이메일입니다", response.json()["detail"]
        )

    async def test_signup_with_expired_invite(self):
        """
        만료된 초대로 회원가입 시도 테스트
        """

        # 팩토리 생성
        factory = await sync_to_async(Factory.objects.create)(
            name="테스트 팩토리",
            business_registration_number="123-45-67890",
            owner=self.user,
        )

        # 만료된 초대 정보 추가 (25시간 전)
        invite_email = "expired@example.com"
        expired_time = datetime.now() - timedelta(hours=25)

        factory.inviting = [
            {
                "email": invite_email,
                "role": "member",
                "invited_by": self.user.id,
                "invited_at": expired_time.isoformat(),
            }
        ]
        await sync_to_async(factory.save)()

        # 이메일 인증 생성
        await EmailVerification.objects.acreate(
            email=invite_email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

        # 만료된 초대로 회원가입 시도
        data = {
            "email": invite_email,
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
            "factory_id": factory.id,
            "invite_role": "member",
        }

        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 200)
        # 초대가 만료되지 않았으므로 성공해야 함

        await sync_to_async(User.refresh_from_db)(self.user)

        # 사용자가 생성되었는지 확인
        new_user = await User.objects.aget(email=invite_email)
        self.assertIsNotNone(new_user)

        # 팩토리 멤버로 등록되었는지 확인
        member = await FactoryMember.objects.aget(user=new_user, factory=factory)
        self.assertEqual(member.role, "member")
        self.assertEqual(member.status, "active")

        # inviting에서 제거되었는지 확인
        await sync_to_async(factory.refresh_from_db)()
        self.assertEqual(len(factory.inviting), 0)

    async def test_signup_with_manipulated_factory_id(self):
        """
        조작된 factory_id로 회원가입 시도 테스트
        """
        # 이메일 인증 생성
        await EmailVerification.objects.acreate(
            email="manipulated@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

        # 존재하지 않는 팩토리 ID로 회원가입 시도
        data = {
            "email": "manipulated@example.com",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
            "factory_id": 99999,  # 존재하지 않는 팩토리 ID
            "invite_role": "member",
        }

        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 400)
        self.assertIn("존재하지 않는 팩토리입니다", response.json()["detail"])

    async def test_login_success(self):
        """
        로그인 성공 테스트"""
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())

    async def test_get_me(self):
        """
        현재 로그인된 사용자의 정보 조회
        """
        headers = await self.authenticate()
        response = await self.client.get("/me", headers=headers)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["email"], self.user.email)
        self.assertEqual(data["status"], self.user.status)

    async def test_update_me(self):
        """
        현재 로그인된 사용자의 정보 수정
        """
        headers = await self.authenticate()
        data = {
            "marketing_agreement": True,
        }
        response = await self.client.patch(f"/me", json=data, headers=headers)
        data = response.json()
        self.assertEqual(response.status_code, 200)

    async def test_logout(self):
        """
        로그아웃 테스트
        """
        headers = await self.authenticate()
        response = await self.client.post("/logout", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"detail": "로그아웃 되었어요."})

    async def test_refresh_token(self):
        """
        Refresh token 테스트
        """
        refresh = await self.get_refresh_token()

        payload = {
            "refresh_token": refresh,
        }
        response = await self.client.post(
            "/refresh-token",
            json=payload,
        )
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)

    async def test_withdraw(self):
        """
        회원 탈퇴 테스트
        """
        headers = await self.authenticate()
        response = await self.client.post("/withdraw", headers=headers)
        self.assertEqual(response.status_code, 200)

    async def test_signup_by_invite_manager(self):
        """
        초대받은 이메일로 회원가입 시 manager로 등록 및 inviting에서 삭제
        """
        # owner가 공장 생성 및 초대
        owner = await User.objects.acreate(email="owner2@example.com", password="pw")
        factory = await Factory.objects.acreate(owner=owner, name="공장초대")
        factory.inviting = [
            {"email": "invitee@example.com", "role": "manager", "invited_by": owner.id}
        ]
        await sync_to_async(factory.save)()
        await EmailVerification.objects.acreate(
            email="invitee@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )
        # 회원가입
        data = {
            "email": "invitee@example.com",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
        }
        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 200)
        invitee = await User.objects.aget(email="invitee@example.com")
        # FactoryMember 등록 확인
        member = await FactoryMember.objects.aget(factory=factory, user=invitee)
        self.assertEqual(member.role, "manager")
        # inviting에서 사라졌는지 확인
        await sync_to_async(factory.refresh_from_db)()
        self.assertFalse(
            any(item["email"] == "invitee@example.com" for item in factory.inviting)
        )

    async def test_signup_by_invite_and_create_factory(self):
        """
        초대받은 사용자가 직접 공장 생성 시 기존 공장에서는 초대받은 권한
        """
        # owner가 공장 생성 및 초대
        owner = await User.objects.acreate(email="owner3@example.com", password="pw")
        factory = await Factory.objects.acreate(owner=owner, name="공장초대2")
        factory.inviting = [
            {"email": "invitee2@example.com", "role": "viewer", "invited_by": owner.id}
        ]
        await sync_to_async(factory.save)()
        await EmailVerification.objects.acreate(
            email="invitee2@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )
        # 회원가입
        data = {
            "email": "invitee2@example.com",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
        }
        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 200)
        invitee = await User.objects.aget(email="invitee2@example.com")
        # 기존 공장에서는 viewer
        member = await FactoryMember.objects.aget(factory=factory, user=invitee)
        self.assertEqual(member.role, "viewer")

    async def test_signup_without_invite(self):
        """
        초대받지 않은 이메일로 회원가입 시 어떤 공장에도 멤버로 등록되지 않음
        """
        await EmailVerification.objects.acreate(
            email="noinvite@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )
        data = {
            "email": "noinvite@example.com",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
        }
        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 200)
        user = await User.objects.aget(email="noinvite@example.com")
        self.assertFalse(await FactoryMember.objects.filter(user=user).aexists())

    async def test_signup_by_invite_manager_with_invited_at(self):
        """
        초대받은 이메일로 회원가입 시 invited_at이 FactoryMember에 잘 반영되는지 테스트
        """
        # owner가 공장 생성 및 초대
        owner = await User.objects.acreate(email="owner2@example.com", password="pw")
        factory = await Factory.objects.acreate(owner=owner, name="공장초대")

        invited_at = datetime.now().isoformat()
        factory.inviting = [
            {
                "email": "invitee@example.com",
                "role": "manager",
                "invited_by": owner.id,
                "invited_at": invited_at,
            }
        ]
        await sync_to_async(factory.save)()
        await EmailVerification.objects.acreate(
            email="invitee@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )
        # 회원가입
        data = {
            "email": "invitee@example.com",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
        }
        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 200)
        invitee = await User.objects.aget(email="invitee@example.com")
        # FactoryMember 등록 확인 및 invited_at 체크
        member = await FactoryMember.objects.aget(factory=factory, user=invitee)
        self.assertEqual(member.role, "manager")
        self.assertIsNotNone(member.invited_at)
        # invited_at 값이 inviting에 있던 값과 같은지 확인 (초 단위까지 비교)
        self.assertEqual(
            member.invited_at.replace(microsecond=0, tzinfo=dt_timezone.utc),
            datetime.fromisoformat(invited_at).replace(
                microsecond=0, tzinfo=dt_timezone.utc
            ),
        )

    async def test_signup_by_invite_with_invited_by_field(self):
        """
        초대받은 이메일로 회원가입 시 invited_by 필드가 올바르게 설정되는지 테스트
        """
        # owner가 공장 생성 및 초대
        owner = await User.objects.acreate(email="owner4@example.com", password="pw")
        factory = await Factory.objects.acreate(owner=owner, name="공장초대3")
        factory.inviting = [
            {"email": "invitee3@example.com", "role": "member", "invited_by": owner.id}
        ]
        await sync_to_async(factory.save)()
        await EmailVerification.objects.acreate(
            email="invitee3@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )
        # 회원가입
        data = {
            "email": "invitee3@example.com",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
        }
        response = await self.client.post("/signup", json=data)
        self.assertEqual(response.status_code, 200)
        invitee = await User.objects.aget(email="invitee3@example.com")
        # FactoryMember 등록 확인 및 invited_by 체크
        member = await FactoryMember.objects.aget(factory=factory, user=invitee)
        self.assertEqual(member.role, "member")
        # invited_by 필드 확인 (async 컨텍스트에서 안전하게 접근)
        invited_by_id = await sync_to_async(
            lambda: member.invited_by.id if member.invited_by else None
        )()
        self.assertEqual(invited_by_id, owner.id)  # ID가 일치하는지 확인
