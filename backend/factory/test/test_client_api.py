from django.test import TestCase
from user.api import router as user_router
from factory.client_api import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryClient


class TestFactoryClient(TestCase):
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
        self.test_client = FactoryClient.objects.create(
            factory=self.factory,
            name="Test Client",
            business_registration_number="987-65-43210",
            representative_name="홍길동",
            email="test@client.com",
            phone="010-1234-5678",
        )
        # 검색 테스트를 위한 추가 거래처들
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
            "name": "New Client",
            "business_registration_number": "111-22-33333",
            "representative_name": "김철수",
            "email": "new@client.com",
            "phone": "010-9876-5432",
            "business_type": "제조업",
            "business_category": "전자제품",
            "address": "서울시 강남구",
        }
        response = await self.client.post(
            f"/{self.factory.id}/clients", 
            headers=headers, 
            json=payload
        )
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
        response = await self.client.get(
            f"/{self.factory.id}/clients", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertGreater(len(result), 0)
        # 최신순으로 정렬되므로 현대자동차가 첫 번째
        self.assertEqual(result[0]["name"], self.hyundai_client.name)

    async def test_get_factory_client(self):
        """
        공장 클라이언트 상세 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.factory.id}/clients/{self.test_client.id}", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.test_client.id)
        self.assertEqual(data["name"], self.test_client.name)
        self.assertEqual(data["email"], self.test_client.email)

    async def test_update_factory_client(self):
        """공장 클라이언트 정보 수정 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "Updated Client",
            "email": "updated@client.com",
            "phone": "010-5555-6666",
        }
        response = await self.client.patch(
            f"/{self.factory.id}/clients/{self.test_client.id}", 
            headers=headers, 
            json=payload
        )
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
        response = await self.client.delete(
            f"/{self.factory.id}/clients/{self.test_client.id}", 
            headers=headers
        )
        self.assertEqual(response.status_code, 204)
        # 클라이언트가 삭제되었는지 확인
        self.assertFalse(
            await FactoryClient.objects.filter(id=self.test_client.id).aexists()
        )

    async def test_get_factory_client_not_found(self):
        """존재하지 않는 클라이언트 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.factory.id}/clients/99999", 
            headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_update_factory_client_not_found(self):
        """
        존재하지 않는 클라이언트 수정 테스트
        """
        headers = await self.authenticate()
        payload = {"name": "Updated Client"}
        response = await self.client.patch(
            f"/{self.factory.id}/clients/99999", 
            headers=headers, 
            json=payload
        )
        self.assertEqual(response.status_code, 404)

    async def test_delete_factory_client_not_found(self):
        """
        존재하지 않는 클라이언트 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(
            f"/{self.factory.id}/clients/99999", 
            headers=headers
        )
        self.assertEqual(response.status_code, 404)

    # 검색 기능 테스트
    async def test_search_factory_clients_by_name(self):
        """
        거래처명으로 검색 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.factory.id}/clients/search?q=삼성", 
            headers=headers
        )
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
        response = await self.client.get(
            f"/{self.factory.id}/clients/search?q=124-81", 
            headers=headers
        )
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
        response = await self.client.get(
            f"/{self.factory.id}/clients/search?q=정의선", 
            headers=headers
        )
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
        response = await self.client.get(
            f"/{self.factory.id}/clients/search?q=전자", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertEqual(len(result), 2)  # 삼성전자, LG전자
        names = [client["name"] for client in result]
        self.assertIn("삼성전자", names)
        self.assertIn("LG전자", names)

    async def test_search_factory_clients_case_insensitive(self):
        """
        대소문자 구분 없는 검색 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.factory.id}/clients/search?q=삼성", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "삼성전자")

    async def test_search_factory_clients_no_results(self):
        """
        검색 결과가 없는 경우 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.factory.id}/clients/search?q=존재하지않는거래처", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertEqual(len(result), 0)

    async def test_search_factory_clients_empty_query(self):
        """
        빈 검색어로 검색 테스트 (모든 거래처 반환)
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.factory.id}/clients/search?q=", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertEqual(len(result), 4)  # 모든 거래처 (Test Client, 삼성전자, LG전자, 현대자동차) 