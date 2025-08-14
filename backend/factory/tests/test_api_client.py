from django.test import TestCase
from user.api import router as user_router
from factory.api_client import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryClient, FactoryMember
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
        # FactoryMember 생성
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role="manager",
            invited_by=self.user,
            status="active",
        )
        self.client_obj = FactoryClient.objects.create(
            factory=self.factory,
            type="customer",
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
            "name": "거래처2",
            "type": "supplier",
            "business_registration_number": "222-33-44444",
            "representative_name": "이몽룡",
            "email": "client2@example.com",
            "phone": "010-2222-3333",
            "business_type": "도소매",
            "business_category": "전자",
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["name"], "거래처2")
        self.assertEqual(data["type"], "supplier")
        self.assertEqual(data["business_registration_number"], "222-33-44444")

    async def test_create_factory_client_duplicate_name(self):
        """
        중복 거래처명 등록 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "거래처1",  # 이미 존재하는 이름
            "type": "supplier",
            "business_registration_number": "999-99-99999",
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("이미 등록된 거래처입니다", data["detail"])

    async def test_create_factory_client_invalid_type(self):
        """
        잘못된 거래처 타입 등록 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "거래처3",
            "type": "invalid_type",  # 잘못된 타입
            "business_registration_number": "333-44-55555",
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("잘못된 거래처 타입입니다", data["detail"])

    async def test_list_factory_clients(self):
        """
        거래처 목록/검색 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}&q=거래처", headers=headers
        )
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
        response = await self.client.get(
            f"/{self.client_obj.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.client_obj.id)
        self.assertEqual(data["name"], "거래처1")
        self.assertEqual(data["type"], "customer")

    async def test_update_factory_client(self):
        """
        거래처 정보 수정 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "거래처1-수정",
            "business_type": "서비스업",
        }
        response = await self.client.patch(
            f"/{self.client_obj.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
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
        response = await self.client.delete(
            f"/{self.client_obj.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 204)

    async def test_get_factory_client_not_found(self):
        """
        존재하지 않는 거래처 상세 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"/99999?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_update_factory_client_not_found(self):
        """
        존재하지 않는 거래처 수정 테스트
        """
        headers = await self.authenticate()
        payload = {"name": "없는 거래처"}
        response = await self.client.patch(
            f"/99999?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 404)

    async def test_delete_factory_client_not_found(self):
        """
        존재하지 않는 거래처 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(
            f"/99999?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_search_all_fields(self):
        """
        거래처 통합검색: 모든 주요 필드별 부분검색 및 type 반환 테스트
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
                response = await self.client.get(
                    f"?factory_id={self.factory.id}&q={value}", headers=headers
                )
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertIn("data", data)
                # 검색 결과에 해당 필드값이 포함된 객체가 있는지 확인
                self.assertTrue(
                    any(value in str(item.get(field, "")) for item in data["data"]),
                    msg=f"{field} 검색 실패: {value}",
                )
                # 모든 결과에 type 필드가 포함되어 있는지 확인
                for item in data["data"]:
                    self.assertIn("type", item)

    async def test_type_always_in_response(self):
        """
        거래처 목록 조회시 type 필드가 항상 포함되는지 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        for item in data["data"]:
            self.assertIn("type", item)

    async def test_search_multiple_clients(self):
        """
        여러 거래처 생성 후, 통합검색(q)으로 각기 다른 거래처가 검색되는지 테스트
        """
        headers = await self.authenticate()
        # 거래처 2, 3 추가 생성
        client2 = await sync_to_async(FactoryClient.objects.create)(
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
        client3 = await sync_to_async(FactoryClient.objects.create)(
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
                response = await self.client.get(
                    f"?factory_id={self.factory.id}&q={q}", headers=headers
                )
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertIn("data", data)
                # 검색 결과에 기대 거래처명이 포함되어 있는지 확인
                self.assertTrue(
                    any(item["name"] == expected_name for item in data["data"]),
                    msg=f"q={q} 검색 결과에 {expected_name}이(가) 없음",
                )
                # type 필드도 항상 포함되어야 함
                for item in data["data"]:
                    self.assertIn("type", item)

    async def test_search_multiple_clients_with_types(self):
        """
        여러 거래처를 수주처/발주처 등 type을 다르게 생성 후, 통합검색(q)으로 각기 다른 거래처와 type이 검색되는지 테스트
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

        # (검색어, 기대 거래처명, 기대 type)
        search_cases = [
            ("거래처1", "거래처1", "customer"),
            ("222-33-44444", "거래처2", "supplier"),
            ("성춘향", "특별상사", "customer"),
            ("special@example.com", "특별상사", "customer"),
            ("010-2222-3333", "거래처2", "supplier"),
            ("서비스업", "특별상사", "customer"),
            ("기계", "거래처1", "customer"),
        ]
        for q, expected_name, expected_type in search_cases:
            with self.subTest(q=q):
                response = await self.client.get(
                    f"?factory_id={self.factory.id}&q={q}", headers=headers
                )
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertIn("data", data)
                # 검색 결과에 기대 거래처명이 포함되어 있고, type도 기대값인지 확인
                self.assertTrue(
                    any(
                        item["name"] == expected_name and item["type"] == expected_type
                        for item in data["data"]
                    ),
                    msg=f"q={q} 검색 결과에 {expected_name}({expected_type})이(가) 없음",
                )
                # type 필드도 항상 포함되어야 함
                for item in data["data"]:
                    self.assertIn("type", item)

    async def test_search_without_q_returns_all(self):
        """
        q 미입력시 전체 거래처가 반환되는지 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertGreaterEqual(len(data["data"]), 1)
        # 응답 구조 확인
        for item in data["data"]:
            self.assertIn("id", item)
            self.assertIn("type", item)
            self.assertIn("name", item)

    async def test_pagination_structure(self):
        """
        페이지네이션 응답 구조가 올바른지 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}&page=1&limit=10", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 페이지네이션 응답 구조 확인
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIn("pageCnt", data)
        self.assertIn("curPage", data)

        # 데이터 타입 확인
        self.assertIsInstance(data["data"], list)
        self.assertIsInstance(data["count"], int)
        self.assertIsInstance(data["totalCnt"], int)
        self.assertIsInstance(data["pageCnt"], int)
        self.assertIsInstance(data["curPage"], int)

    async def test_empty_result_pagination(self):
        """
        검색 결과가 없을 때도 페이지네이션이 정상 작동하는지 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}&q=존재하지않는거래처", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 빈 결과에서도 페이지네이션 구조 확인
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertEqual(data["count"], 0)
        self.assertEqual(len(data["data"]), 0)

    async def test_multiple_pages(self):
        """
        여러 페이지가 있는 경우 페이지네이션이 정상 작동하는지 테스트
        """
        headers = await self.authenticate()

        # 여러 거래처 생성
        for i in range(15):
            await FactoryClient.objects.acreate(
                factory=self.factory,
                type="customer",
                name=f"거래처{i+2}",
                business_registration_number=f"{(i+2):03d}-{(i+2):02d}-{(i+2):05d}",
                representative_name=f"대표자{i+2}",
                email=f"client{i+2}@example.com",
            )

        # 첫 번째 페이지 테스트 (기본 page_size=10)
        response = await self.client.get(
            f"?factory_id={self.factory.id}&page=1", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 10)  # 기본 page_size=10
        self.assertEqual(data["curPage"], 1)

        # 두 번째 페이지 테스트
        response = await self.client.get(
            f"?factory_id={self.factory.id}&page=2", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 6)  # 16개 중 10개는 첫 페이지, 나머지 6개
        self.assertEqual(data["curPage"], 2)

        # 세 번째 페이지 테스트 (데이터가 없어야 함)
        response = await self.client.get(
            f"?factory_id={self.factory.id}&page=3", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 0)  # 더 이상 데이터 없음
        self.assertEqual(data["curPage"], 3)

    async def test_schema_validation(self):
        """
        반환되는 데이터가 FactoryClientOut 스키마와 호환되는지 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # FactoryClientOut 스키마 필드 확인
        required_fields = [
            "id",
            "type",
            "name",
            "business_registration_number",
            "representative_name",
            "business_type",
            "business_category",
            "phone",
            "email",
            "note",
        ]

        for item in data["data"]:
            for field in required_fields:
                self.assertIn(field, item, f"필드 '{field}'가 응답에 없습니다")

            # 필드 타입 확인
            self.assertIsInstance(item["id"], int)
            self.assertIsInstance(item["type"], str)
            self.assertIsInstance(item["name"], str)

    async def test_create_factory_client_without_type(self):
        """
        type 필드 없이 거래처 등록 테스트 (기본값 customer 사용)
        """
        headers = await self.authenticate()
        payload = {
            "name": "거래처4",
            "business_registration_number": "444-55-66666",
            "representative_name": "김철수",
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["name"], "거래처4")
        self.assertEqual(data["type"], "customer")  # 기본값

    async def test_create_factory_client_with_null_type(self):
        """
        type 필드를 null로 거래처 등록 테스트 (기본값 customer 사용)
        """
        headers = await self.authenticate()
        payload = {
            "name": "거래처5",
            "type": None,
            "business_registration_number": "555-66-77777",
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["name"], "거래처5")
        self.assertEqual(data["type"], "customer")  # 기본값
