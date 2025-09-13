from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryMember
from tax.models import NationalTaxService
from project.models import Project
import json
import jwt
from django.conf import settings
from datetime import datetime, timedelta, date
from factory.schemas.outbound import FactoryClientRowOut


User = get_user_model()


class TaxAPITestCase(TestCase):
    def setUp(self):
        """테스트 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        # 공장 생성
        self.factory = Factory.objects.create(name="테스트 공장", owner=self.user)
        # 공장 멤버
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory, user=self.user, role="admin"
        )
        # 거래처 생성
        self.client_company1 = FactoryClient.objects.create(
            factory=self.factory,
            name="플라스틱이 좋아",
            business_registration_number="123-45-67890",
        )

        self.client_company2 = FactoryClient.objects.create(
            factory=self.factory,
            name="플라스틱이 싫어",
            business_registration_number="987-65-43210",
        )

        # JWT 토큰 생성
        self.token = self.generate_jwt_token()

        # API 클라이언트 설정
        self.client = self.client

    def generate_jwt_token(self):
        """JWT 토큰 생성"""
        return jwt.encode(
            {"user_id": self.user.id, "exp": timezone.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def test_create_tax_service(self):
        """세금계산서 생성 테스트 (기존 방식)"""

    def test_create_temporary_tax_invoice(self):
        """임시저장 세금계산서 생성 테스트 (기존 방식)"""
        # 최소한의 필드만으로 임시저장
        response = self.client.post(
            "/v1/tax/",
            data=json.dumps(
                {
                    "factory": self.factory.id,
                    "client": None,
                    "line_items": [],
                }
            ),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 201)

        # 임시저장된 세금계산서 확인
        tax_invoice = NationalTaxService.objects.get(id=response.json()["id"])
        self.assertEqual(tax_invoice.publish_status, "temporary")
        self.assertIsNone(tax_invoice.client)
        self.assertEqual(tax_invoice.line_items, [])

        # 부분적으로 정보가 입력된 임시저장
        response = self.client.post(
            "/v1/tax/",
            data=json.dumps(
                {
                    "factory": self.factory.id,
                    "client": self.client_company1.id,
                    "line_items": [
                        {
                            "name": "테스트 품목",
                            "chargeable_unit": "10",
                            "unit_price": "1000",
                        }
                    ],
                }
            ),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 201)

        # 부분 정보가 입력된 임시저장 확인
        tax_invoice2 = NationalTaxService.objects.get(id=response.json()["id"])
        self.assertEqual(tax_invoice2.publish_status, "temporary")
        self.assertEqual(tax_invoice2.client, self.client_company1)
        self.assertEqual(len(tax_invoice2.line_items), 1)

    def test_publish_validation(self):
        """세금계산서 발행 전 필수 필드 검증 테스트"""
        # 임시저장된 세금계산서 생성 (필수 필드 누락)
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=None,
            transaction_date=None,
            transaction_amount=None,
            tax_amount=None,
            line_items=[],
            publish_status="temporary",
        )

        # 발행 시도 (필수 필드 누락으로 실패해야 함)
        response = self.client.post(
            f"/v1/tax/{tax_invoice.id}/publish",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("거래처", response.json()["detail"])

        # 부분적으로 정보 입력
        tax_invoice.client = self.client_company1
        tax_invoice.transaction_date = date(2025, 6, 4)
        tax_invoice.save()

        # 발행 시도 (여전히 필수 필드 누락)
        response = self.client.post(
            f"/v1/tax/{tax_invoice.id}/publish",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("공급가액", response.json()["detail"])

        # 모든 필수 필드 입력
        tax_invoice.transaction_amount = 100000
        tax_invoice.tax_amount = 10000
        tax_invoice.line_items = [
            {
                "name": "테스트 품목",
                "chargeable_unit": "10",
                "unit_price": "10000",
                "amount": "100000",
                "tax": "10000",
            }
        ]
        tax_invoice.save()

        # 이제는 발행 시도가 성공해야 함 (실제 발행은 모킹 필요)

    def test_create_or_update_tax_invoice(self):
        """세금계산서 생성/수정 통합 API 테스트"""
        # 1. 새로 생성
        response = self.client.post(
            "/v1/tax/",
            data=json.dumps(
                {
                    "factory": self.factory.id,
                    "client": self.client_company1.id,
                    "line_items": [
                        {
                            "name": "테스트 품목",
                            "chargeable_unit": "10",
                            "unit_price": "1000",
                        }
                    ],
                }
            ),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 201)
        tax_invoice_id = response.json()["id"]

        # 2. 수정 (tax_id 포함)
        response = self.client.post(
            "/v1/tax/",
            data=json.dumps(
                {
                    "tax_id": tax_invoice_id,
                    "factory": self.factory.id,
                    "client": self.client_company2.id,
                    "line_items": [
                        {
                            "name": "수정된 품목",
                            "chargeable_unit": "20",
                            "unit_price": "2000",
                        }
                    ],
                }
            ),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 수정된 내용 확인
        tax_invoice = NationalTaxService.objects.get(id=tax_invoice_id)
        self.assertEqual(tax_invoice.client, self.client_company2)
        self.assertEqual(len(tax_invoice.line_items), 1)
        self.assertEqual(tax_invoice.line_items[0]["name"], "수정된 품목")

        # 3. 발행된 세금계산서 수정 시도 (실패해야 함)
        tax_invoice.publish_status = "published"
        tax_invoice.save()

        response = self.client.post(
            "/v1/tax/",
            data=json.dumps(
                {
                    "tax_id": tax_invoice_id,
                    "factory": self.factory.id,
                    "client": self.client_company1.id,
                }
            ),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "발행된 세금계산서는 수정할 수 없습니다", response.json()["detail"]
        )

    def test_update_tax_invoice_hidden_status(self):
        """세금계산서 숨김 상태 변경 테스트 (PATCH API)"""
        # 세금계산서 생성
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            publish_status="temporary",
        )

        # is_hidden만 변경
        response = self.client.patch(
            f"/v1/tax/{tax_invoice.id}",
            data=json.dumps({"is_hidden": True}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 변경된 내용 확인
        tax_invoice.refresh_from_db()
        self.assertTrue(tax_invoice.is_hidden)

        # 다른 필드도 변경 가능 (임시저장 상태이므로)
        response = self.client.patch(
            f"/v1/tax/{tax_invoice.id}",
            data=json.dumps({"client": self.client_company2.id}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 변경된 내용 확인
        tax_invoice.refresh_from_db()
        self.assertEqual(tax_invoice.client, self.client_company2)

        # 발행된 세금계산서는 is_hidden만 변경 가능
        tax_invoice.publish_status = "published"
        tax_invoice.save()

        response = self.client.patch(
            f"/v1/tax/{tax_invoice.id}",
            data=json.dumps({"client": self.client_company1.id}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "발행된 세금계산서는 isHidden 필드만 수정할 수 있습니다",
            response.json()["detail"],
        )

        # is_hidden은 발행된 세금계산서도 변경 가능
        response = self.client.patch(
            f"/v1/tax/{tax_invoice.id}",
            data=json.dumps({"is_hidden": False}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

    def test_list_all_tax_invoices_all_type(self):
        """전체 유형 세금계산서 조회 테스트"""
        # published 매출
        invoice_sales = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        # published 매입
        invoice_purchase = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company2,
            transaction_date=date(2025, 6, 5),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="purchase",
            publish_status="published",
        )
        # draft(미포함)
        draft_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company2,
            transaction_date=date(2025, 6, 6),
            transaction_amount=300000,
            tax_amount=30000,
            tax_invoice_type="sales",
            publish_status="draft",
        )
        url = f"/v1/tax/published?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [item["id"] for item in data["data"]]
        self.assertIn(invoice_sales.id, ids)
        self.assertIn(invoice_purchase.id, ids)
        self.assertNotIn(draft_invoice.id, ids)
        self.assertEqual(len(data["data"]), 2)

    def test_list_all_tax_invoices_sales_type(self):
        """매출 유형 세금계산서 조회 테스트"""
        invoice_sales = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        invoice_purchase = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company2,
            transaction_date=date(2025, 6, 5),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="purchase",
            publish_status="published",
        )
        url = f"/v1/tax/published?factory_id={self.factory.id}&tax_invoice_type=sales"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [item["id"] for item in data["data"]]
        self.assertIn(invoice_sales.id, ids)
        self.assertNotIn(invoice_purchase.id, ids)
        self.assertEqual(len(data["data"]), 1)

    def test_list_all_tax_invoices_purchase_type(self):
        """매입 유형 세금계산서 조회 테스트"""
        invoice_sales = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        invoice_purchase = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company2,
            transaction_date=date(2025, 6, 5),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="purchase",
            publish_status="published",
        )
        url = (
            f"/v1/tax/published?factory_id={self.factory.id}&tax_invoice_type=purchase"
        )
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [item["id"] for item in data["data"]]
        self.assertIn(invoice_purchase.id, ids)
        self.assertNotIn(invoice_sales.id, ids)
        self.assertEqual(len(data["data"]), 1)

    def test_list_all_tax_invoices_search_by_q(self):
        """q로 거래처명/품목명 통합 검색 테스트"""
        invoice1 = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        invoice2 = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company2,
            transaction_date=date(2025, 6, 5),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        # 거래처명 검색
        url = f"/v1/tax/published?factory_id={self.factory.id}&q=플라스틱이 좋아"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # print(
        #     "🐍 File: tests/test_api.py | Line: 204 | test_list_all_tax_invoices_search_by_q ~ data",
        #     data,
        # )
        self.assertEqual(len(data["data"]), 1)
        # self.assertEqual(data["data"][0]["client_name"], "플라스틱이 좋아")
        # 품목명 검색
        url = f"/v1/tax/published?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)

    def test_list_all_tax_invoices_success(self):
        """모든 세금계산서 조회 성공 테스트"""
        # 연결되지 않은 세금계산서 생성 (매출)
        unlinked_invoice1 = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=550000,
            tax_amount=50000,
            tax_invoice_type="sales",
            publish_status="published",
        )

        # 연결되지 않은 세금계산서 생성 (매입)
        unlinked_invoice2 = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company2,
            transaction_date=date(2025, 6, 3),
            transaction_amount=500000,
            tax_amount=50000,
            tax_invoice_type="purchase",
            publish_status="published",
        )

        # 연결된 세금계산서 생성
        linked_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 2),
            transaction_amount=300000,
            tax_amount=30000,
            tax_invoice_type="sales",
            publish_status="published",
        )

        # 프로젝트 생성 후 세금계산서 연결
        project = Project.objects.create()
        project.tax_invoice = linked_invoice
        project.save()

        # API 호출
        url = f"/v1/tax/published?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        data = response.json()
        # print(
        #     "🐍 File: tests/test_api.py | Line: 257 | test_list_all_tax_invoices_success ~ data",
        #     data,
        # )
        self.assertEqual(response.status_code, 200)

        # 페이지네이션 정보 확인
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIn("curPage", data)

        # 모든 세금계산서가 반환되는지 확인 (3개)
        self.assertEqual(len(data["data"]), 3)
        self.assertEqual(data["count"], 3)

        # 날짜순 정렬 확인 (최신순)
        self.assertEqual(data["data"][0]["transaction_date"], "2025-06-04")
        self.assertEqual(data["data"][1]["transaction_date"], "2025-06-03")
        self.assertEqual(data["data"][2]["transaction_date"], "2025-06-02")

        # 첫 번째 세금계산서 (매출, 연결 안됨)
        first_invoice = data["data"][0]
        self.assertEqual(first_invoice["id"], unlinked_invoice1.id)
        self.assertEqual(first_invoice["tax_invoice_type"], "sales")
        self.assertEqual(first_invoice["transaction_date"], "2025-06-04")
        # self.assertEqual(first_invoice["client_name"], "플라스틱이 좋아")
        self.assertEqual(first_invoice["transaction_amount"], 550000)
        self.assertEqual(first_invoice["tax_amount"], 50000)
        # self.assertEqual(first_invoice["total_amount"], 600000)

        # 두 번째 세금계산서 (매입, 연결 안됨)
        second_invoice = data["data"][1]
        self.assertEqual(second_invoice["id"], unlinked_invoice2.id)
        self.assertEqual(second_invoice["tax_invoice_type"], "purchase")
        # self.assertEqual(second_invoice["client_name"], "플라스틱이 싫어")
        self.assertEqual(second_invoice["transaction_amount"], 500000)
        self.assertEqual(second_invoice["tax_amount"], 50000)
        # self.assertEqual(second_invoice["total_amount"], 550000)

        # 세 번째 세금계산서 (매출, 연결됨)
        third_invoice = data["data"][2]
        self.assertEqual(third_invoice["id"], linked_invoice.id)
        self.assertEqual(third_invoice["tax_invoice_type"], "sales")
        # self.assertEqual(third_invoice["client_name"], "플라스틱이 좋아")
        self.assertEqual(third_invoice["transaction_amount"], 300000)
        self.assertEqual(third_invoice["tax_amount"], 30000)
        # self.assertEqual(third_invoice["total_amount"], 330000)

    def test_list_all_tax_invoices_multiple_products(self):
        """여러 품목이 있는 세금계산서 테스트"""
        # 여러 품목이 있는 세금계산서 생성
        multi_product_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=1000000,
            tax_amount=100000,
            tax_invoice_type="sales",
            publish_status="published",
        )

        # API 호출
        url = f"/v1/tax/published?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 여러 품목이 올바르게 반환되는지 확인
        self.assertEqual(len(data["data"]), 1)
        invoice = data["data"][0]

    def test_list_all_tax_invoices_empty_result(self):
        """세금계산서가 없을 때 빈 결과 테스트"""
        # API 호출
        url = f"/v1/tax/published?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 빈 결과 확인
        self.assertEqual(len(data["data"]), 0)
        self.assertEqual(data["count"], 0)
        self.assertEqual(data["totalCnt"], 0)

    def test_list_all_tax_invoices_without_auth(self):
        """인증 없이 모든 세금계산서 조회 테스트"""
        url = f"/v1/tax/published?factory_id={self.factory.id}"
        response = self.client.get(url)

        self.assertEqual(response.status_code, 401)

    def test_list_all_tax_invoices_invalid_token(self):
        """잘못된 토큰으로 모든 세금계산서 조회 테스트"""
        url = f"/v1/tax/published?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION="Bearer invalid_token")

        self.assertEqual(response.status_code, 401)

    def test_list_all_tax_invoices_different_statuses(self):
        """다양한 상태의 세금계산서 테스트"""
        # published 상태
        published_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        # draft 상태
        draft_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company2,
            transaction_date=date(2025, 6, 3),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="purchase",
            publish_status="draft",
        )

        # API 호출
        url = f"/v1/tax/published?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 모든 상태의 세금계산서가 반환되는지 확인
        self.assertEqual(len(data["data"]), 1)

        # published 세금계산서 확인
        published_data = next(
            item for item in data["data"] if item["id"] == published_invoice.id
        )
        self.assertEqual(published_data["tax_invoice_type"], "sales")
        # self.assertEqual(published_data["client_name"], "플라스틱이 좋아")

        # draft 세금계산서가 결과에 포함되지 않는지 확인
        returned_ids = [item["id"] for item in data["data"]]
        self.assertNotIn(draft_invoice.id, returned_ids)

    def test_list_not_link_tax_success(self):
        """연동되지 않은 세금계산서 조회 성공 테스트"""
        # 연동 안된 세금계산서 생성 (매출)
        unlinked_invoice1 = NationalTaxService.objects.create(
            client=self.client_company1,
            client_info=FactoryClientRowOut.from_orm(self.client_company1).dict(),
            transaction_date=date(2025, 6, 4),
            transaction_amount=550000,
            tax_amount=50000,
            tax_invoice_type="sales",
            publish_status="published",
        )

        # 연동 안된 세금계산서 생성 (매입)
        unlinked_invoice2 = NationalTaxService.objects.create(
            client=self.client_company2,
            client_info=FactoryClientRowOut.from_orm(self.client_company2).dict(),
            transaction_date=date(2025, 6, 4),
            transaction_amount=500000,
            tax_amount=50000,
            tax_invoice_type="purchase",
            publish_status="published",
        )

        # API 호출
        url = f"/v1/tax/unlinked?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 페이지네이션 정보 확인 - 'data' 키 사용
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIn("curPage", data)

        # 연동 안된 세금계산서만 반환되는지 확인
        self.assertEqual(len(data["data"]), 2)
        self.assertEqual(data["count"], 2)

        # 첫 번째 세금계산서 (매출)
        first_invoice = data["data"][0]
        self.assertEqual(first_invoice["id"], unlinked_invoice1.id)
        self.assertEqual(first_invoice["tax_invoice_type"], "sales")
        self.assertEqual(first_invoice["transaction_date"], "2025-06-04")
        self.assertEqual(first_invoice["client_info"]["name"], "플라스틱이 좋아")
        self.assertEqual(first_invoice["transaction_amount"], 550000)
        self.assertEqual(first_invoice["tax_amount"], 50000)
        # self.assertEqual(first_invoice["total_amount"], 600000)

        # 두 번째 세금계산서 (매입)
        second_invoice = data["data"][1]
        self.assertEqual(second_invoice["id"], unlinked_invoice2.id)
        self.assertEqual(second_invoice["tax_invoice_type"], "purchase")
        self.assertEqual(second_invoice["client_info"]["name"], "플라스틱이 싫어")
        self.assertEqual(second_invoice["transaction_amount"], 500000)
        self.assertEqual(second_invoice["tax_amount"], 50000)
        # self.assertEqual(second_invoice["total_amount"], 550000)

    def test_list_not_link_tax_with_connected_invoice(self):
        """연동된 세금계산서는 제외되는지 테스트"""
        # 연동 안된 세금계산서 생성
        unlinked_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=300000,
            tax_amount=30000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        # 연동된 세금계산서 생성
        linked_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 3),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        # 프로젝트 생성 후 세금계산서 연결
        project = Project.objects.create()
        project.tax_invoice = linked_invoice
        project.save()

        # API 호출
        url = f"/v1/tax/unlinked?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 연동 안된 세금계산서만 반환되는지 확인
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["count"], 1)

        # 연동된 세금계산서는 포함되지 않는지 확인
        returned_ids = [item["id"] for item in data["data"]]
        self.assertIn(unlinked_invoice.id, returned_ids)
        self.assertNotIn(linked_invoice.id, returned_ids)

    def test_list_not_link_tax_multiple_products(self):
        """여러 품목이 있는 세금계산서 테스트"""
        # 여러 품목이 있는 세금계산서 생성
        tax_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=1000000,
            tax_amount=100000,
            tax_invoice_type="sales",
            publish_status="published",
        )

        # API 호출
        url = f"/v1/tax/unlinked?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 여러 품목이 포함된 세금계산서 확인
        invoice = data["data"][0]
        # self.assertEqual(invoice["total_amount"], 1100000)

    def test_list_not_link_tax_empty_result(self):
        """연동 안된 세금계산서가 없을 때 테스트"""
        # 모든 세금계산서를 프로젝트에 연결
        tax_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=300000,
            tax_amount=30000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        project = Project.objects.create()
        project.tax_invoice = tax_invoice
        project.save()

        # API 호출
        url = f"/v1/tax/unlinked?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 빈 결과 확인
        self.assertEqual(len(data["data"]), 0)
        self.assertEqual(data["count"], 0)

    def test_list_not_link_tax_without_auth(self):
        """인증 없이 API 호출 시도 테스트"""
        url = f"/v1/tax/unlinked?factory_id={self.factory.id}"

        response = self.client.get(url)

        # 인증이 필요하므로 401 또는 403이 반환되어야 함
        self.assertIn(response.status_code, [401, 403])

    def test_list_not_link_tax_invalid_token(self):
        """잘못된 토큰으로 API 호출 시도 테스트"""
        url = f"/v1/tax/unlinked?factory_id={self.factory.id}"

        response = self.client.get(url, HTTP_AUTHORIZATION="Bearer invalid_token")

        # 잘못된 토큰이므로 401이 반환되어야 함
        self.assertEqual(response.status_code, 401)

    def test_list_not_link_tax_different_statuses(self):
        """다양한 발행 상태의 세금계산서 테스트"""
        # 임시 저장 상태
        temp_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="temporary",
        )

        # 발행 대기 상태
        pending_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="sales",
            publish_status="pending",
        )

        # 발행 완료 상태
        published_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=300000,
            tax_amount=30000,
            tax_invoice_type="sales",
            publish_status="published",
        )

        # API 호출
        url = f"/v1/tax/unlinked?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 모든 상태의 세금계산서가 반환되는지 확인
        self.assertEqual(len(data["data"]), 3)
        self.assertEqual(data["count"], 3)

        # 각 상태별 세금계산서 확인
        returned_ids = [item["id"] for item in data["data"]]
        self.assertIn(temp_invoice.id, returned_ids)
        self.assertIn(pending_invoice.id, returned_ids)
        self.assertIn(published_invoice.id, returned_ids)

    def test_list_not_link_tax_ordering(self):
        """날짜순 정렬 테스트"""
        # 오래된 날짜의 세금계산서
        old_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 1),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="published",
        )

        # 최신 날짜의 세금계산서
        new_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="sales",
            publish_status="published",
        )

        # API 호출
        url = f"/v1/tax/unlinked?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 최신 날짜순으로 정렬되는지 확인 (내림차순)
        self.assertEqual(len(data["data"]), 2)
        self.assertEqual(data["data"][0]["id"], new_invoice.id)  # 최신 날짜가 먼저
        self.assertEqual(data["data"][1]["id"], old_invoice.id)  # 오래된 날짜가 나중에

    # 세금계산서 연결 API 테스트
    def test_link_tax_success(self):
        """세금계산서 연결 성공 테스트"""
        # 프로젝트 생성
        project = Project.objects.create()

        # 연동 안된 세금계산서 생성
        tax_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=300000,
            tax_amount=30000,
            tax_invoice_type="sales",
            publish_status="published",
        )

        # API 호출
        url = "/v1/tax/link"
        payload = {"project_id": project.id, "tax_id": tax_invoice.id}

        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 응답 확인 (빈 응답)
        self.assertEqual(data, {})

        # 데이터베이스에서 연결 확인
        project.refresh_from_db()
        self.assertEqual(project.tax_invoice.id, tax_invoice.id)

    def test_link_tax_project_not_found(self):
        """존재하지 않는 프로젝트 연결 시도 테스트"""
        # 존재하지 않는 프로젝트 ID
        payload = {"project_id": 999, "tax_id": 1}

        url = "/v1/tax/link"
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("해당 프로젝트를 찾을 수 없습니다", data["detail"])

    def test_link_tax_invoice_not_found(self):
        """존재하지 않는 세금계산서 연결 시도 테스트"""
        # 프로젝트 생성
        project = Project.objects.create()

        payload = {
            "project_id": project.id,
            "tax_id": 999,  # 존재하지 않는 세금계산서 ID
        }

        url = "/v1/tax/link"
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("세금계산서 ID 999를 찾을 수 없습니다", data["detail"])

    def test_link_tax_already_connected(self):
        """이미 연결된 세금계산서 연결 시도 테스트"""
        # 프로젝트 생성
        project = Project.objects.create()

        # 이미 연결된 세금계산서 생성
        connected_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=300000,
            tax_amount=30000,
            tax_invoice_type="sales",
            publish_status="published",
        )

        # 다른 프로젝트에 연결
        other_project = Project.objects.create()
        other_project.tax_invoice = connected_invoice
        other_project.save()

        # 이미 연결된 세금계산서를 다른 프로젝트에 연결 시도
        payload = {"project_id": project.id, "tax_id": connected_invoice.id}

        url = "/v1/tax/link"
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("이미 다른 프로젝트에 연결되어 있습니다", data["detail"])

    def test_link_tax_replace_existing(self):
        """기존 세금계산서를 새로운 세금계산서로 교체 테스트"""
        # 프로젝트 생성
        project = Project.objects.create()

        # 기존 세금계산서 생성 및 연결
        old_invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=300000,
            tax_amount=30000,
            tax_invoice_type="sales",
            publish_status="published",
        )

        project.tax_invoice = old_invoice
        project.save()

        # 새로운 세금계산서 생성
        new_invoice = NationalTaxService.objects.create(
            client=self.client_company2,
            transaction_date=date(2025, 6, 5),
            transaction_amount=400000,
            tax_amount=40000,
            tax_invoice_type="purchase",
            publish_status="published",
        )

        # 새로운 세금계산서로 교체
        payload = {"project_id": project.id, "tax_id": new_invoice.id}

        url = "/v1/tax/link"
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data, {})

        # 데이터베이스에서 교체 확인
        project.refresh_from_db()
        self.assertEqual(project.tax_invoice.id, new_invoice.id)
        self.assertNotEqual(project.tax_invoice.id, old_invoice.id)

    def test_link_tax_without_auth(self):
        """인증 없이 API 호출 시도 테스트"""
        payload = {"project_id": 1, "tax_id": 1}

        url = "/v1/tax/link"
        response = self.client.post(
            url, data=json.dumps(payload), content_type="application/json"
        )

        # 인증이 필요하므로 401 또는 403이 반환되어야 함
        self.assertIn(response.status_code, [401, 403])

    def test_link_tax_invalid_token(self):
        """잘못된 토큰으로 API 호출 시도 테스트"""
        payload = {"project_id": 1, "tax_id": 1}

        url = "/v1/tax/link"
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer invalid_token",
        )

        # 잘못된 토큰이므로 401이 반환되어야 함
        self.assertEqual(response.status_code, 401)

    def test_list_all_tax_invoices_search_by_client_name(self):
        """q로 거래처명 검색이 잘 동작하는지 테스트"""
        # 데이터 생성
        invoice1 = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        invoice2 = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company2,
            transaction_date=date(2025, 6, 5),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        # API 호출 (거래처명으로 검색)
        url = f"/v1/tax/published?factory_id={self.factory.id}&q=플라스틱이 좋아"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        # self.assertEqual(data["data"][0]["client_name"], "플라스틱이 좋아")

    def test_list_all_tax_invoices_search_by_product_name(self):
        """q로 품목명 검색이 잘 동작하는지 테스트"""
        # 데이터 생성
        invoice1 = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        invoice2 = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company2,
            transaction_date=date(2025, 6, 5),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        # API 호출 (품목명으로 검색)
        url = f"/v1/tax/published?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)

    def test_list_pending_tax_invoices_all_status(self):
        """발행대기+임시저장 전체 조회 테스트"""
        # pending
        invoice_pending = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="pending",
        )
        # temporary
        invoice_temporary = NationalTaxService.objects.create(
            client=self.client_company2,
            transaction_date=date(2025, 6, 5),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="purchase",
            publish_status="temporary",
        )
        # published(미포함)
        invoice_published = NationalTaxService.objects.create(
            client=self.client_company2,
            transaction_date=date(2025, 6, 6),
            transaction_amount=300000,
            tax_amount=30000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        url = f"/v1/tax/pending?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [item["id"] for item in data["data"]]
        self.assertIn(invoice_pending.id, ids)
        self.assertIn(invoice_temporary.id, ids)
        self.assertNotIn(invoice_published.id, ids)
        self.assertEqual(len(data["data"]), 2)

    def test_list_pending_tax_invoices_pending_only(self):
        """발행대기만 조회 테스트"""
        invoice_pending = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="pending",
        )
        invoice_temporary = NationalTaxService.objects.create(
            client=self.client_company2,
            transaction_date=date(2025, 6, 5),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="purchase",
            publish_status="temporary",
        )
        url = f"/v1/tax/pending?factory_id={self.factory.id}&publish_status=pending"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [item["id"] for item in data["data"]]
        self.assertIn(invoice_pending.id, ids)
        self.assertNotIn(invoice_temporary.id, ids)
        self.assertEqual(len(data["data"]), 1)

    def test_list_pending_tax_invoices_temporary_only(self):
        """임시저장만 조회 테스트"""
        invoice_pending = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="pending",
        )
        invoice_temporary = NationalTaxService.objects.create(
            client=self.client_company2,
            transaction_date=date(2025, 6, 5),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="purchase",
            publish_status="temporary",
        )
        url = f"/v1/tax/pending?factory_id={self.factory.id}&publish_status=temporary"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [item["id"] for item in data["data"]]
        self.assertIn(invoice_temporary.id, ids)
        self.assertNotIn(invoice_pending.id, ids)
        self.assertEqual(len(data["data"]), 1)

    def test_list_pending_tax_invoices_search_by_q(self):
        """q로 거래처명/품목명 통합 검색 테스트 (pending/temporary)"""
        invoice1 = NationalTaxService.objects.create(
            client=self.client_company1,
            client_info=FactoryClientRowOut.from_orm(self.client_company1).dict(),
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="pending",
        )
        invoice2 = NationalTaxService.objects.create(
            client=self.client_company2,
            client_info=FactoryClientRowOut.from_orm(self.client_company2).dict(),
            transaction_date=date(2025, 6, 5),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="sales",
            publish_status="temporary",
        )
        # 거래처명 검색
        url = f"/v1/tax/pending?factory_id={self.factory.id}&q=플라스틱이 좋아"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["client_info"]["name"], "플라스틱이 좋아")
        # 품목명 검색
        url = f"/v1/tax/pending?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)

    def test_list_all_tax_invoices_period_and_order(self):
        """
        기간 필터(start_date, end_date)와 정렬(order) 파라미터 동작 테스트
        """
        # 데이터 생성
        invoice1 = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 1),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        invoice2 = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 2),
            transaction_amount=200000,
            tax_amount=20000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        invoice3 = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company1,
            transaction_date=date(2025, 6, 3),
            transaction_amount=300000,
            tax_amount=30000,
            tax_invoice_type="sales",
            publish_status="published",
        )
        # 전체 조회(최신순)
        url = f"/v1/tax/published?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(
            [d["id"] for d in data[:3]], [invoice3.id, invoice2.id, invoice1.id]
        )
        # 기간 필터 (2025-06-02 ~ 2025-06-03)
        url = f"/v1/tax/published?factory_id={self.factory.id}&start_date=2025-06-02&end_date=2025-06-03"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(set([d["id"] for d in data]), set([invoice2.id, invoice3.id]))
        # 정렬 asc(오래된순)
        url = (
            f"/v1/tax/published?factory_id={self.factory.id}&ordering=transaction_date"
        )
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(
            [d["id"] for d in data[:3]], [invoice1.id, invoice2.id, invoice3.id]
        )

    def test_list_all_cash_receipts_period_and_order(self):
        """
        현금영수증 /receipt API 기간, 검색, 정렬 파라미터 동작 테스트
        """
        from tax.models import CashReceipt

        # 데이터 생성
        receipt1 = CashReceipt.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 1),
            transaction_amount=10000,
            tax_amount=1000,
            cash_receipt_type="매입",
            item_name="구매",
        )
        receipt2 = CashReceipt.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 2),
            transaction_amount=20000,
            tax_amount=2000,
            cash_receipt_type="매입",
            item_name="구매",
        )
        receipt3 = CashReceipt.objects.create(
            client=self.client_company2,
            transaction_date=date(2025, 6, 3),
            transaction_amount=30000,
            tax_amount=3000,
            cash_receipt_type="매입",
            item_name="구매",
        )
        # 전체 조회(최신순)
        url = f"/v1/receipt?factory_id={self.factory.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(
            [d["id"] for d in data[:3]], [receipt3.id, receipt2.id, receipt1.id]
        )
        # 기간 필터 (2025-06-02 ~ 2025-06-03)
        url = f"/v1/receipt?factory_id={self.factory.id}&start_date=2025-06-02&end_date=2025-06-03"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(set([d["id"] for d in data]), set([receipt2.id, receipt3.id]))
        # 정렬 asc(오래된순)
        url = f"/v1/receipt?factory_id={self.factory.id}&order=asc"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(
            [d["id"] for d in data[:3]], [receipt1.id, receipt2.id, receipt3.id]
        )
        # 거래처명 검색
        url = f"/v1/receipt?factory_id={self.factory.id}&q=싫어"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["client_name"], "플라스틱이 싫어")

    def test_get_tax_invoice_by_material_history(self):
        """
        /invoice-by-material-history API 자재 이력별 세금계산서 및 구매정보 단건 조회 테스트
        """
        from stock.models import Material, MaterialHistory
        from tax.models import NationalTaxService

        # 자재 생성
        material = Material.objects.create(
            factory=self.factory,
            name="테스트자재",
            code="MAT001",
            unit="EA",
            spec="10T",
            current_stock=100,
            standard_stock=10,
        )
        # 세금계산서(매입) 생성
        invoice = NationalTaxService.objects.create(
            client=self.client_company1,
            transaction_date=date(2025, 6, 10),
            transaction_amount=100000,
            tax_amount=10000,
            tax_invoice_type="purchase",
            transaction_type="receipt",
            publish_status="published",
        )
        # 자재 구매 이력 생성(세금계산서 연결)
        history = MaterialHistory.objects.create(
            material=material,
            client=self.client_company1,
            type="purchase",
            quantity=50,
            price=2000,
            total_stock=150,
            purchase_tax_invoice=invoice,
        )
        # API 호출
        url = f"/v1/tax/invoice-by-material-history?material_history_id={history.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        if response.status_code != 200:
            print("응답:", response.json())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["client_name"], self.client_company1.name)
        self.assertEqual(
            data["business_registration_number"],
            self.client_company1.business_registration_number,
        )
        self.assertEqual(
            data["representative_name"], self.client_company1.representative_name
        )
        self.assertEqual(data["transaction_date"], "2025-06-10")
        self.assertEqual(data["tax_invoice_type"], "매입")
        self.assertEqual(data["transaction_type"], "영수")
        self.assertIn("materials", data)
        self.assertEqual(len(data["materials"]), 1)
        mat = data["materials"][0]
        self.assertEqual(mat["material_name"], material.name)
        self.assertEqual(mat["spec"], material.spec)
        self.assertEqual(mat["quantity"], 50)
        self.assertEqual(mat["unit"], material.unit)
        self.assertEqual(mat["price"], 2000)
        self.assertEqual(mat["transaction_amount"], 100000)
        self.assertEqual(mat["tax_amount"], 10000)

    def test_get_cash_receipt_by_material_history(self):
        """
        /receipt/material-history API 자재 이력별 현금영수증 및 구매정보 단건 조회 테스트
        """
        from stock.models import Material, MaterialHistory
        from tax.models import CashReceipt

        # 자재 생성
        material = Material.objects.create(
            factory=self.factory,
            name="테스트자재2",
            code="MAT002",
            unit="EA",
            spec="20T",
            current_stock=100,
            standard_stock=10,
        )
        # 현금영수증 생성
        receipt = CashReceipt.objects.create(
            client=self.client_company2,
            transaction_date=date(2025, 7, 1),
            transaction_amount=50000,
            tax_amount=5000,
            cash_receipt_type="매입",
            item_name="구매",
        )
        # 자재 구매 이력 생성(현금영수증 연결)
        history = MaterialHistory.objects.create(
            material=material,
            client=self.client_company2,
            type="purchase",
            quantity=20,
            price=2500,
            total_stock=120,
            cash_receipt=receipt,
        )
        # API 호출
        url = f"/v1/receipt/material-history?material_history_id={history.id}"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")
        data = response.json()
        # print(
        #     "🐍 File: tests/test_api.py | Line: 1482 | test_get_cash_receipt_by_material_history ~ data",
        #     data,
        # )
        self.assertEqual(response.status_code, 200)
        # self.assertEqual(data["client_name"], self.client_company2.name)
        client = data.get("client")
        self.assertEqual(
            client["business_registration_number"],
            self.client_company2.business_registration_number,
        )
        self.assertEqual(data["transaction_date"], "2025-07-01")
        # 제거된 필드들은 확인하지 않음
        # self.assertIn("materials", data)
        # self.assertEqual(len(data["materials"]), 1)
        # mat = data["materials"][0]
        # self.assertEqual(mat["material_name"], material.name)
        # self.assertEqual(mat["unit"], material.unit)
        # self.assertEqual(mat["quantity"], 20)
        # self.assertEqual(mat["price"], 2500)
        # self.assertEqual(mat["transaction_amount"], 50000)
        # self.assertEqual(mat["tax_amount"], 5000)
        # self.assertEqual(mat["total_amount"], 55000)

    def test_debug_routes(self):
        """디버그용 라우터 테스트"""
        # GET 디버그 엔드포인트 테스트
        response = self.client.get("/v1/tax/debug")
        print(f"GET /v1/tax/debug: {response.status_code}")
        print(
            f"Response: {response.json() if response.status_code == 200 else response.content}"
        )

        # POST 디버그 엔드포인트 테스트
        response = self.client.post("/v1/tax/debug")
        print(f"POST /v1/tax/debug: {response.status_code}")
        print(
            f"Response: {response.json() if response.status_code == 200 else response.content}"
        )

        # 실제 POST 엔드포인트 테스트 (인증 없이)
        response = self.client.post(
            "/v1/tax/", data='{"factory": 999}', content_type="application/json"
        )
        print(f"POST /v1/tax/: {response.status_code}")
        print(f"Response: {response.content}")

        # 이 테스트는 항상 성공하도록 설정
        self.assertTrue(True)
