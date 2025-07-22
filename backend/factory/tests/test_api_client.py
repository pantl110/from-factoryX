from django.test import TestCase
from user.api import router as user_router
from factory.api_client import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryClient
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
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Test Factory",
            business_registration_number="123-45-67890",
        )
        self.client_obj = FactoryClient.objects.create(
            factory=self.factory,
            type="customer",  # 명시적으로 추가!
            name="거래처1",
            business_registration_number="111-22-33333",
            representative_name="홍길동",
            email="client1@example.com",
            phone="010-1111-2222",
            business_type="제조업",
            business_category="기계",
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

    async def test_create_factory_client(self):
        """
        거래처 등록 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "name": "거래처2",
            "business_registration_number": "222-33-44444",
            "representative_name": "이몽룡",
            "email": "client2@example.com",
            "phone": "010-2222-3333",
            "business_type": "도소매",
            "business_category": "전자",
        }
        response = await self.client.post("/", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["name"], "거래처2")
        self.assertEqual(data["business_registration_number"], "222-33-44444")

    async def test_list_factory_clients(self):
        """
        거래처 목록/검색 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"?factory_id={self.factory.id}&q=거래처", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertGreaterEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["name"], "거래처1")

    async def test_get_factory_client_detail(self):
        """
        거래처 상세 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.client_obj.id}?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.client_obj.id)
        self.assertEqual(data["name"], "거래처1")

    async def test_update_factory_client(self):
        """
        거래처 정보 수정 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "거래처1-수정",
            "business_type": "서비스업",
        }
        response = await self.client.patch(f"/{self.client_obj.id}?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.client_obj.id)
        self.assertEqual(data["name"], "거래처1-수정")
        self.assertEqual(data["business_type"], "서비스업")

    async def test_delete_factory_client(self):
        """
        거래처 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(f"/{self.client_obj.id}?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 204)

    async def test_get_factory_client_not_found(self):
        """
        존재하지 않는 거래처 상세 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"/99999?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_update_factory_client_not_found(self):
        """
        존재하지 않는 거래처 수정 테스트
        """
        headers = await self.authenticate()
        payload = {"name": "없는 거래처"}
        response = await self.client.patch(f"/99999?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)

    async def test_delete_factory_client_not_found(self):
        """
        존재하지 않는 거래처 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(f"/99999?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_search_all_fields(self):
        """
        거래처 통합검색: 모든 주요 필드별 부분검색 및 client_type 반환 테스트
        """
        headers = await self.authenticate()
        # 각 필드별로 검색어를 다르게 테스트
        search_cases = [
            ("name", "거래처1"),
            ("business_registration_number", "111-22-33333"),
            ("representative_name", "홍길동"),
            ("email", "client1@example.com"),
            ("phone", "010-1111-2222"),
            ("business_type", "제조업"),
            ("business_category", "기계"),
        ]
        for field, value in search_cases:
            with self.subTest(field=field):
                response = await self.client.get(f"?factory_id={self.factory.id}&q={value}", headers=headers)
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertIn("data", data)
                # 검색 결과에 해당 필드값이 포함된 객체가 있는지 확인
                self.assertTrue(
                    any(value in str(item.get(field, "")) for item in data["data"]),
                    msg=f"{field} 검색 실패: {value}"
                )
                # 모든 결과에 client_type 필드가 포함되어 있는지 확인
                for item in data["data"]:
                    self.assertIn("client_type", item)

    async def test_client_type_always_in_response(self):
        """
        거래처 목록 조회시 client_type 필드가 항상 포함되는지 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        for item in data["data"]:
            self.assertIn("client_type", item)

    async def test_search_multiple_clients(self):
        """
        여러 거래처 생성 후, 통합검색(q)으로 각기 다른 거래처가 검색되는지 테스트
        """
        headers = await self.authenticate()
        # 거래처 2, 3 추가 생성
        client2 = await sync_to_async(FactoryClient.objects.create)(
            factory=self.factory,
            name="거래처2",
            business_registration_number="222-33-44444",
            representative_name="이몽룡",
            email="client2@example.com",
            phone="010-2222-3333",
            business_type="도소매",
            business_category="전자",
        )
        client3 = await sync_to_async(FactoryClient.objects.create)(
            factory=self.factory,
            name="특별상사",
            business_registration_number="333-44-55555",
            representative_name="성춘향",
            email="special@example.com",
            phone="010-3333-4444",
            business_type="서비스업",
            business_category="식품",
        )

        # (검색어, 기대 거래처명)
        search_cases = [
            ("거래처1", "거래처1"),
            ("222-33-44444", "거래처2"),
            ("성춘향", "특별상사"),
            ("special@example.com", "특별상사"),
            ("010-2222-3333", "거래처2"),
            ("서비스업", "특별상사"),
            ("기계", "거래처1"),
        ]
        for q, expected_name in search_cases:
            with self.subTest(q=q):
                response = await self.client.get(f"?factory_id={self.factory.id}&q={q}", headers=headers)
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertIn("data", data)
                # 검색 결과에 기대 거래처명이 포함되어 있는지 확인
                self.assertTrue(
                    any(item["name"] == expected_name for item in data["data"]),
                    msg=f"q={q} 검색 결과에 {expected_name}이(가) 없음"
                )
                # client_type 필드도 항상 포함되어야 함
                for item in data["data"]:
                    self.assertIn("client_type", item)

    async def test_search_multiple_clients_with_types(self):
        """
        여러 거래처를 수주처/발주처 등 type을 다르게 생성 후, 통합검색(q)으로 각기 다른 거래처와 client_type이 검색되는지 테스트
        """
        headers = await self.authenticate()
        # 거래처 2, 3 추가 생성 (type 다르게)
        client2 = await sync_to_async(FactoryClient.objects.create)(
            factory=self.factory,
            type="supplier",  # 발주처
            name="거래처2",
            business_registration_number="222-33-44444",
            representative_name="이몽룡",
            email="client2@example.com",
            phone="010-2222-3333",
            business_type="도소매",
            business_category="전자",
        )
        client3 = await sync_to_async(FactoryClient.objects.create)(
            factory=self.factory,
            type="customer",  # 수주처
            name="특별상사",
            business_registration_number="333-44-55555",
            representative_name="성춘향",
            email="special@example.com",
            phone="010-3333-4444",
            business_type="서비스업",
            business_category="식품",
        )

        # (검색어, 기대 거래처명, 기대 client_type)
        search_cases = [
            ("거래처1", "거래처1", "customer"),  # 기본값이 customer
            ("222-33-44444", "거래처2", "supplier"),
            ("성춘향", "특별상사", "customer"),
            ("special@example.com", "특별상사", "customer"),
            ("010-2222-3333", "거래처2", "supplier"),
            ("서비스업", "특별상사", "customer"),
            ("기계", "거래처1", "customer"),
        ]
        for q, expected_name, expected_type in search_cases:
            with self.subTest(q=q):
                response = await self.client.get(f"?factory_id={self.factory.id}&q={q}", headers=headers)
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertIn("data", data)
                # 검색 결과에 기대 거래처명이 포함되어 있고, client_type도 기대값인지 확인
                self.assertTrue(
                    any(item["name"] == expected_name and item["client_type"] == expected_type for item in data["data"]),
                    msg=f"q={q} 검색 결과에 {expected_name}({expected_type})이(가) 없음"
                )
                # client_type 필드도 항상 포함되어야 함
                for item in data["data"]:
                    self.assertIn("client_type", item)

    async def test_search_without_q_returns_all(self):
        """
        q 미입력시 전체 거래처가 반환되는지 테스트
        """
        headers = await self.authenticate()
        # 거래처 2, 3 추가 생성
        await sync_to_async(FactoryClient.objects.create)(
            factory=self.factory,
            type="supplier",
            name="거래처2",
            business_registration_number="222-33-44444",
            representative_name="이몽룡",
            email="client2@example.com",
            phone="010-2222-3333",
            business_type="도소매",
            business_category="전자",
        )
        await sync_to_async(FactoryClient.objects.create)(
            factory=self.factory,
            type="customer",
            name="특별상사",
            business_registration_number="333-44-55555",
            representative_name="성춘향",
            email="special@example.com",
            phone="010-3333-4444",
            business_type="서비스업",
            business_category="식품",
        )

        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        # 전체 거래처 3개가 모두 반환되어야 함
        names = [item["name"] for item in data["data"]]
        self.assertIn("거래처1", names)
        self.assertIn("거래처2", names)
        self.assertIn("특별상사", names)
        # client_type 필드도 항상 포함되어야 함
        for item in data["data"]:
            self.assertIn("client_type", item)
            print(item)
