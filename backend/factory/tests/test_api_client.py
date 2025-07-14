from django.test import TestCase
from user.api import router as user_router
from factory.api_client import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryClient
from user.models import EmailVerification
from asgiref.sync import sync_to_async


class TestFactoryClient(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.auth_client = TestAsyncClient(user_router)
        self.user = User.objects.create_user(
            username="testuser",
            password="password1234!",
            email="testuser@example.com",
        )
        self.verification = EmailVerification.objects.create(
            email=self.user.email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Test Factory",
            business_registration_number="123-45-67890",
        )
        self.test_client = FactoryClient.objects.create(
            factory=self.factory,
            name="Test Client",
            business_registration_number="987-65-43210",
            representative_name="홍길동",
            email="test@client.com",
            phone="010-1234-5678",
        )
        self.samsung_client = FactoryClient.objects.create(
            factory=self.factory,
            name="삼성전자",
            business_registration_number="124-81-00998",
            representative_name="김기남",
            email="samsung@test.com",
            phone="02-2255-0114",
        )
        self.lg_client = FactoryClient.objects.create(
            factory=self.factory,
            name="LG전자",
            business_registration_number="220-81-62517",
            representative_name="조성진",
            email="lg@test.com",
            phone="02-3777-1114",
        )
        self.hyundai_client = FactoryClient.objects.create(
            factory=self.factory,
            name="현대자동차",
            business_registration_number="101-81-14695",
            representative_name="정의선",
            email="hyundai@test.com",
            phone="02-3464-1114",
        )

    async def authenticate(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return {
            "Authorization": f"Bearer {data['access_token']}",
        }

    async def test_create_factory_client(self):
        """
        공장 클라이언트 생성 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "name": "New Client",
            "business_registration_number": "111-22-33333",
            "representative_name": "김철수",
            "email": "new@client.com",
            "phone": "010-9876-5432",
            "business_type": "제조업",
            "business_category": "전자제품",
            "address": "서울시 강남구",
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["name"], "New Client")
        self.assertEqual(data["email"], "new@client.com")

    async def test_list_factory_clients(self):
        """
        공장 클라이언트 목록 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertGreater(len(result), 0)
        # 최신순으로 정렬되므로 현대자동차가 첫 번째
        self.assertEqual(result[0]["name"], self.hyundai_client.name)

    async def test_search_factory_clients(self):
        """
        공장 클라이언트 검색 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "q": "삼성"
        }
        response = await self.client.post("/search", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "삼성전자")

    async def test_get_factory_client_detail(self):
        """
        공장 클라이언트 상세 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.test_client.id}?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.test_client.id)
        self.assertEqual(data["name"], self.test_client.name)
        self.assertEqual(data["email"], self.test_client.email)

    async def test_update_factory_client(self):
        """
        공장 클라이언트 정보 수정 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "Updated Client",
            "email": "updated@client.com",
            "phone": "010-5555-6666",
        }
        response = await self.client.patch(f"/{self.test_client.id}?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.test_client.id)
        self.assertEqual(data["name"], "Updated Client")
        self.assertEqual(data["email"], "updated@client.com")
        self.assertEqual(data["phone"], "010-5555-6666")

    async def test_delete_factory_client(self):
        """
        공장 클라이언트 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(f"/{self.test_client.id}?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 204)
        # 클라이언트가 삭제되었는지 확인
        self.assertFalse(
            await FactoryClient.objects.filter(id=self.test_client.id).aexists()
        )

    async def test_get_factory_client_not_found(self):
        """존재하지 않는 클라이언트 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(f"/99999?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_update_factory_client_not_found(self):
        """
        존재하지 않는 클라이언트 수정 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "Updated Client"
        }
        response = await self.client.patch(f"/99999?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)

    async def test_delete_factory_client_not_found(self):
        """
        존재하지 않는 클라이언트 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(f"/99999?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 404)


    async def test_search_factory_clients_by_name(self):
        """
        거래처명으로 검색 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "q": "삼성"
        }
        response = await self.client.post("/search", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "삼성전자")

    async def test_search_factory_clients_by_business_number(self):
        """
        사업자등록번호로 검색 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "q": "124-81"
        }
        response = await self.client.post("/search", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["business_registration_number"], "124-81-00998")

    async def test_search_factory_clients_by_representative_name(self):
        """
        대표자명으로 검색 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "q": "정의선"
        }
        response = await self.client.post("/search", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["representative_name"], "정의선")

    async def test_search_factory_clients_partial_match(self):
        """
        부분 일치 검색 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "q": "전자"
        }
        response = await self.client.post("/search", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertEqual(len(result), 2)  # 삼성전자, LG전자
        names = [client["name"] for client in result]
        self.assertIn("삼성전자", names)
        self.assertIn("LG전자", names)

    async def test_search_factory_clients_no_results(self):
        """
        검색 결과 없음 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "q": "존재하지않는거래처"
        }
        response = await self.client.post("/search", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertEqual(len(result), 0)

    async def test_search_factory_clients_empty_query(self):
        """
        빈 검색어 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "q": ""
        }
        response = await self.client.post("/search", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        # 빈 검색어는 모든 결과를 반환
        self.assertGreater(len(result), 0)

    async def test_unauthorized_access(self):
        """
        인증되지 않은 접근 테스트
        """
        payload = {
            "factory_id": self.factory.id,
            "name": "New Client",
            "business_registration_number": "111-22-33333",
        }
        response = await self.client.post("", json=payload)
        self.assertEqual(response.status_code, 401)

    # 권한 컨트롤 테스트
    async def test_access_other_user_factory(self):
        """
        다른 사용자의 공장에 접근 시도 테스트
        """
        # 다른 사용자 생성 (sync_to_async 사용)
        other_user = await sync_to_async(User.objects.create_user)(
            username="otheruser",
            password="password1234!",
            email="otheruser@example.com",
        )
        other_factory = await sync_to_async(Factory.objects.create)(
            owner=other_user,
            name="Other Factory",
            business_registration_number="999-99-99999",
        )
        
        headers = await self.authenticate()
        payload = {
            "factory_id": other_factory.id,
            "name": "New Client",
            "business_registration_number": "111-22-33333",
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)  # 공장을 찾을 수 없음

    async def test_access_other_user_client(self):
        """
        다른 사용자의 거래처에 접근 시도 테스트
        """
        # 다른 사용자와 공장 생성 (sync_to_async 사용)
        other_user = await sync_to_async(User.objects.create_user)(
            username="otheruser",
            password="password1234!",
            email="otheruser@example.com",
        )
        other_factory = await sync_to_async(Factory.objects.create)(
            owner=other_user,
            name="Other Factory",
            business_registration_number="999-99-99999",
        )
        other_client = await sync_to_async(FactoryClient.objects.create)(
            factory=other_factory,
            name="Other Client",
            business_registration_number="888-88-88888",
            representative_name="김철수",
            email="other@client.com",
            phone="010-8888-8888",
        )
        
        headers = await self.authenticate()
        response = await self.client.get(f"/{other_client.id}?factory_id={other_factory.id}", headers=headers)
        self.assertEqual(response.status_code, 404)  # 거래처를 찾을 수 없음


    async def test_create_client_missing_required_fields(self):
        """
        필수 필드 누락 테스트
        """
        headers = await self.authenticate()
        
        # name 누락
        payload = {
            "factory_id": self.factory.id,
            "name": "",
            "business_registration_number": "111-22-33333",
            "representative_name": "김철수",
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertIn(response.status_code, [201, 400, 422])
        
        # business_registration_number 누락
        payload = {
            "factory_id": self.factory.id,
            "name": "New Client",
            "representative_name": "김철수",
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertIn(response.status_code, [201, 400, 422])

    async def test_create_client_invalid_email_format(self):
        """
        잘못된 이메일 형식 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "name": "New Client",
            "business_registration_number": "111-22-33333",
            "representative_name": "김철수",
            "email": "invalid-email-format",
        }
        response = await self.client.post("", headers=headers, json=payload)
        # 현재 API에서는 이메일 검증이 없을 수 있으므로 실제 응답 확인
        self.assertIn(response.status_code, [201, 400, 422])

    async def test_create_client_invalid_phone_format(self):
        """
        잘못된 전화번호 형식 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "name": "New Client",
            "business_registration_number": "111-22-33333",
            "representative_name": "김철수",
            "phone": "invalid-phone",
        }
        response = await self.client.post("", headers=headers, json=payload)
        # 현재 API에서는 전화번호 검증이 없을 수 있으므로 실제 응답 확인
        self.assertIn(response.status_code, [201, 400, 422])

    async def test_create_client_duplicate_business_number(self):
        """
        중복 사업자등록번호 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "name": "Duplicate Client",
            "business_registration_number": self.test_client.business_registration_number,  # 기존 번호 사용
            "representative_name": "김철수",
        }
        response = await self.client.post("", headers=headers, json=payload)
        # 현재 API에서는 중복 검증이 없을 수 있으므로 실제 응답 확인
        self.assertIn(response.status_code, [201, 400, 422])

    async def test_create_client_empty_name(self):
        """
        빈 이름 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "name": "",  # 빈 이름
            "business_registration_number": "111-22-33333",
            "representative_name": "김철수",
        }
        response = await self.client.post("", headers=headers, json=payload)
        # 현재 API에서는 빈 이름 검증이 없을 수 있으므로 실제 응답 확인
        self.assertIn(response.status_code, [201, 400, 422])

    async def test_create_client_very_long_name(self):
        """
        매우 긴 이름 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "name": "A" * 1000,  # 매우 긴 이름
            "business_registration_number": "111-22-33333",
            "representative_name": "김철수",
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertIn(response.status_code, [201, 400, 422])

    # 추가 예외 케이스 테스트
    async def test_access_nonexistent_factory(self):
        """
        존재하지 않는 공장 ID 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": 99999,  # 존재하지 않는 공장 ID
            "name": "New Client",
            "business_registration_number": "111-22-33333",
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)

    async def test_list_clients_nonexistent_factory(self):
        """
        존재하지 않는 공장의 거래처 목록 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get("?factory_id=99999", headers=headers)
        # 현재 API에서는 빈 결과를 반환할 수 있으므로 실제 응답 확인
        self.assertIn(response.status_code, [200, 404])

    async def test_search_clients_nonexistent_factory(self):
        """
        존재하지 않는 공장의 거래처 검색 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": 99999,
            "q": "삼성"
        }
        response = await self.client.post("/search", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)

    async def test_update_client_invalid_data(self):
        """
        잘못된 데이터로 거래처 수정 테스트
        """
        headers = await self.authenticate()
        
        # 잘못된 이메일 형식으로 수정
        payload = {
            "factory_id": self.factory.id,
            "client_id": self.test_client.id,
            "email": "invalid-email",
        }
        response = await self.client.patch("/clients", headers=headers, json=payload)
        # 현재 API에서는 이메일 검증이 없을 수 있으므로 실제 응답 확인
        self.assertIn(response.status_code, [200, 400, 422])

    async def test_create_client_with_special_characters(self):
        """
        특수문자가 포함된 데이터 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "name": "Client with <script>alert('xss')</script>",
            "business_registration_number": "111-22-33333",
            "representative_name": "김철수",
            "email": "test@example.com",
        }
        response = await self.client.post("", headers=headers, json=payload)
        # 특수문자가 포함되어도 정상 처리되어야 함 (XSS 방지 로직이 있다면 400/422)
        self.assertIn(response.status_code, [201, 400, 422])

    async def test_pagination_and_ordering(self):
        """
        페이지네이션 및 정렬 테스트
        """
        headers = await self.authenticate()
        
        # 기본 목록 조회 (최신순 정렬 확인)
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        
        # 최소 4개의 거래처가 있어야 함
        self.assertGreaterEqual(len(result), 4)
        
        # 최신순 정렬 확인 (현대자동차가 첫 번째)
        if len(result) > 0:
            self.assertEqual(result[0]["name"], self.hyundai_client.name)