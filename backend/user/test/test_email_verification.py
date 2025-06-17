from django.test import TestCase, TransactionTestCase
from ninja.testing import TestAsyncClient
from user.api import router
from user.models import User, EmailVerification
from django.utils import timezone
from datetime import timedelta
import json
from asgiref.sync import sync_to_async


class TestEmailVerificationFlow(TransactionTestCase):
    """이메일 인증 플로우 테스트"""
    
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.test_email = "test@example.com"
        self.test_username = "testuser"
        self.test_password = "password123!"
        
    async def test_scenario_1_signup_and_login(self):
        """상황 1: 회원가입 및 로그인 전체 플로우 테스트"""
        
        # 1. 회원가입용 이메일 인증 코드 발송
        verification_data = {
            "email": self.test_email,
            "verification_type": "회원가입"
        }
        response = await self.client.post("/send-verification-code", json=verification_data)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("인증 코드가 발송되었습니다", response_data["detail"])
        
        # 2. 발송된 인증 코드 확인 (DB에서 직접 조회)
        verification = await sync_to_async(EmailVerification.objects.get)(
            email=self.test_email,
            verification_type="회원가입",
            is_verified=False
        )
        self.assertIsNotNone(verification)
        self.assertEqual(len(verification.code), 6)
        
        # 3. 인증 코드 검증
        code_verification_data = {
            "email": self.test_email,
            "code": verification.code,
            "verification_type": "회원가입"
        }
        response = await self.client.post("/verify-code", json=code_verification_data)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data["is_verified"])
        
        # 4. 회원가입
        signup_data = {
            "username": self.test_username,
            "email": self.test_email,
            "password": self.test_password,
            "password_confirm": self.test_password,
            "terms_of_service": True,
            "privacy_policy_agreement": True
        }
        response = await self.client.post("/signup", json=signup_data)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["username"], self.test_username)
        
        # 5. 로그인
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        response = await self.client.post("/login", json=login_data)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("status", response_data)
        
        # 개발 환경에서는 토큰이 응답에 포함됨
        if "access_token" in response_data:
            self.assertIsNotNone(response_data["access_token"])
            self.assertIsNotNone(response_data["refresh_token"])
    
    async def test_scenario_2_signup_password_reset_login(self):
        """상황 2: 회원가입 -> 비밀번호 수정 -> 로그인 전체 플로우 테스트"""
        
        # === 1단계: 회원가입 플로우 ===
        
        # 1-1. 회원가입용 이메일 인증 코드 발송
        verification_data = {
            "email": self.test_email,
            "verification_type": "회원가입"
        }
        response = await self.client.post("/send-verification-code", json=verification_data)
        self.assertEqual(response.status_code, 200)
        
        # 1-2. 인증 코드 확인 및 검증
        verification = await sync_to_async(EmailVerification.objects.get)(
            email=self.test_email,
            verification_type="회원가입",
            is_verified=False
        )
        
        code_verification_data = {
            "email": self.test_email,
            "code": verification.code,
            "verification_type": "회원가입"
        }
        response = await self.client.post("/verify-code", json=code_verification_data)
        self.assertEqual(response.status_code, 200)
        
        # 1-3. 회원가입
        signup_data = {
            "username": self.test_username,
            "email": self.test_email,
            "password": self.test_password,
            "password_confirm": self.test_password,
            "terms_of_service": True,
            "privacy_policy_agreement": True
        }
        response = await self.client.post("/signup", json=signup_data)
        self.assertEqual(response.status_code, 200)
        
        # === 2단계: 비밀번호 재설정 플로우 ===
        
        # 2-1. 비밀번호 재설정용 이메일 인증 코드 발송
        password_reset_verification_data = {
            "email": self.test_email,
            "verification_type": "비밀번호재설정"
        }
        response = await self.client.post("/send-verification-code", json=password_reset_verification_data)
        self.assertEqual(response.status_code, 200)
        
        # 2-2. 비밀번호 재설정용 인증 코드 확인
        reset_verification = await sync_to_async(EmailVerification.objects.get)(
            email=self.test_email,
            verification_type="비밀번호재설정",
            is_verified=False
        )
        
        reset_code_verification_data = {
            "email": self.test_email,
            "code": reset_verification.code,
            "verification_type": "비밀번호재설정"
        }
        response = await self.client.post("/verify-code", json=reset_code_verification_data)
        self.assertEqual(response.status_code, 200)
        
        # 2-3. 비밀번호 재설정
        new_password = "newpassword123!"
        password_reset_data = {
            "email": self.test_email,
            "code": reset_verification.code,
            "new_password": new_password,
            "new_password_confirm": new_password
        }
        response = await self.client.post("/reset-password", json=password_reset_data)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("비밀번호가 성공적으로 변경되었습니다", response_data["detail"])
        
        # === 3단계: 새 비밀번호로 로그인 ===
        
        # 3-1. 새 비밀번호로 로그인 성공 확인
        login_data = {
            "email": self.test_email,
            "password": new_password
        }
        response = await self.client.post("/login", json=login_data)
        self.assertEqual(response.status_code, 200)
        
        # 3-2. 기존 비밀번호로 로그인 실패 확인
        old_login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        response = await self.client.post("/login", json=old_login_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("비밀번호가 일치하지 않습니다", response_data["detail"])


class TestEmailVerificationEdgeCases(TransactionTestCase):
    """이메일 인증 엣지 케이스 테스트"""
    
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.test_email = "test@example.com"
        
    async def test_invalid_email_format(self):
        """잘못된 이메일 형식 테스트"""
        verification_data = {
            "email": "invalid-email",
            "verification_type": "회원가입"
        }
        response = await self.client.post("/send-verification-code", json=verification_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("올바른 이메일 형식이 아닙니다", response_data["detail"])
    
    async def test_invalid_verification_type(self):
        """잘못된 인증 타입 테스트"""
        verification_data = {
            "email": self.test_email,
            "verification_type": "잘못된타입"
        }
        response = await self.client.post("/send-verification-code", json=verification_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("올바르지 않은 인증 타입입니다", response_data["detail"])
    
    async def test_wrong_verification_code(self):
        """잘못된 인증 코드 테스트"""
        # 먼저 정상적으로 인증 코드 발송
        verification_data = {
            "email": self.test_email,
            "verification_type": "회원가입"
        }
        await self.client.post("/send-verification-code", json=verification_data)
        
        # 잘못된 코드로 검증 시도
        wrong_code_data = {
            "email": self.test_email,
            "code": "000000",
            "verification_type": "회원가입"
        }
        response = await self.client.post("/verify-code", json=wrong_code_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("유효하지 않은 인증 코드입니다", response_data["detail"])
    
    async def test_expired_verification_code(self):
        """만료된 인증 코드 테스트"""
        # 인증 코드 발송
        verification_data = {
            "email": self.test_email,
            "verification_type": "회원가입"
        }
        await self.client.post("/send-verification-code", json=verification_data)
        
        # DB에서 인증 코드를 강제로 만료시킴
        verification = await sync_to_async(EmailVerification.objects.get)(
            email=self.test_email,
            verification_type="회원가입",
            is_verified=False
        )
        verification.expires_at = timezone.now() - timedelta(minutes=1)
        await sync_to_async(verification.save)()
        
        # 만료된 코드로 검증 시도
        expired_code_data = {
            "email": self.test_email,
            "code": verification.code,
            "verification_type": "회원가입"
        }
        response = await self.client.post("/verify-code", json=expired_code_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("인증 코드가 만료되었습니다", response_data["detail"])
    
    async def test_duplicate_email_signup(self):
        """이미 등록된 이메일로 회원가입 시도"""
        # 먼저 사용자 생성
        await sync_to_async(User.objects.create_user)(
            username="existing_user",
            email=self.test_email,
            password="password123!"
        )
        
        # 동일한 이메일로 인증 코드 발송 시도
        verification_data = {
            "email": self.test_email,
            "verification_type": "회원가입"
        }
        response = await self.client.post("/send-verification-code", json=verification_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("이미 등록된 이메일입니다", response_data["detail"])
    
    async def test_password_reset_nonexistent_email(self):
        """존재하지 않는 이메일로 비밀번호 재설정 시도"""
        verification_data = {
            "email": "nonexistent@example.com",
            "verification_type": "비밀번호재설정"
        }
        response = await self.client.post("/send-verification-code", json=verification_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("등록되지 않은 이메일입니다", response_data["detail"])
    
    async def test_signup_without_email_verification(self):
        """이메일 인증 없이 회원가입 시도"""
        signup_data = {
            "username": "testuser",
            "email": self.test_email,
            "password": "password123!",
            "password_confirm": "password123!",
            "terms_of_service": True,
            "privacy_policy_agreement": True
        }
        response = await self.client.post("/signup", json=signup_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("이메일 인증을 먼저 완료해주세요", response_data["detail"])
    
    async def test_password_mismatch_signup(self):
        """비밀번호 확인 불일치 회원가입 시도"""
        # 먼저 이메일 인증 완료
        verification_data = {
            "email": self.test_email,
            "verification_type": "회원가입"
        }
        await self.client.post("/send-verification-code", json=verification_data)
        
        verification = await sync_to_async(EmailVerification.objects.get)(
            email=self.test_email,
            verification_type="회원가입",
            is_verified=False
        )
        
        code_verification_data = {
            "email": self.test_email,
            "code": verification.code,
            "verification_type": "회원가입"
        }
        await self.client.post("/verify-code", json=code_verification_data)
        
        # 비밀번호 불일치로 회원가입 시도
        signup_data = {
            "username": "testuser",
            "email": self.test_email,
            "password": "password123!",
            "password_confirm": "different_password!",
            "terms_of_service": True,
            "privacy_policy_agreement": True
        }
        response = await self.client.post("/signup", json=signup_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("비밀번호가 일치하지 않습니다", response_data["detail"])


class TestLoginEdgeCases(TransactionTestCase):
    """로그인 엣지 케이스 테스트"""
    
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.test_email = "test@example.com"
        self.test_password = "password123!"
        
    async def test_login_invalid_email_format(self):
        """잘못된 이메일 형식으로 로그인 시도"""
        login_data = {
            "email": "invalid-email",
            "password": self.test_password
        }
        response = await self.client.post("/login", json=login_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("올바른 이메일 형식이 아닙니다", response_data["detail"])
    
    async def test_login_nonexistent_email(self):
        """존재하지 않는 이메일로 로그인 시도"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": self.test_password
        }
        response = await self.client.post("/login", json=login_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("등록되지 않은 이메일입니다", response_data["detail"])
    
    async def test_login_wrong_password(self):
        """잘못된 비밀번호로 로그인 시도"""
        # 먼저 사용자 생성
        await sync_to_async(User.objects.create_user)(
            username="testuser",
            email=self.test_email,
            password=self.test_password
        )
        
        login_data = {
            "email": self.test_email,
            "password": "wrong_password"
        }
        response = await self.client.post("/login", json=login_data)
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn("비밀번호가 일치하지 않습니다", response_data["detail"])
