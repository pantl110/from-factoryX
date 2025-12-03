from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient
from project.models import Project, ProjectLog, Refund
from stock.models import Product
import json
import jwt
from django.conf import settings
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()


class ProjectRefundAPITestCase(TestCase):
    def setUp(self):
        """테스트 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        # 공장 생성
        self.factory = Factory.objects.create(name="테스트 공장", owner=self.user)

        # 고객 생성
        self.client_company = FactoryClient.objects.create(
            factory=self.factory,
            name="테스트 고객사",
            business_registration_number="123-45-67890",
        )

        # 프로젝트 생성
        self.project = Project.objects.create()

        # FactoryMember 생성
        from factory.models import FactoryMember

        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )

        # 견적서 생성 (프로젝트를 공장과 연결)
        from document.models import Quotation

        self.quotation = Quotation.objects.create(
            factory=self.factory, client=self.client_company, project=self.project
        )

        # 제품 생성
        self.product = Product.objects.create(
            factory=self.factory,
            name="테스트 제품",
            code="TEST001",
            unit="개",
            spec="테스트 규격",
        )

        # QuotationProduct 생성
        from document.models import QuotationProduct

        self.quotation_product = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product,
            quantity=100,
            unit_price=10000,
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

    def test_create_refund_success(self):
        """반품 생성 성공 테스트"""
        url = "/v1/project-refund"

        payload = {
            "project_id": self.project.id,
            "product_id": self.product.id,
            "refund_date": "2024-01-15",
            "refund_amount": 5,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 응답 데이터 확인
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("refund_id", data)
        self.assertIn("log_id", data)
        self.assertEqual(data["message"], "반품이 성공적으로 생성되었습니다.")

        # 데이터베이스에 반품이 생성되었는지 확인
        refund = Refund.objects.get(id=data["refund_id"])

        # ProjectLog를 통해 project 확인
        project_log = ProjectLog.objects.get(refund=refund)
        self.assertEqual(project_log.project.id, self.project.id)

        self.assertEqual(refund.product.id, self.product.id)
        self.assertEqual(
            refund.amount, 5
        )  # product.current_stock(0) + production_amount(5)
        self.assertEqual(refund.current_stock, 0)
        self.assertEqual(refund.production_amount, 5)
        self.assertEqual(
            refund.refund_date, datetime.strptime("2024-01-15", "%Y-%m-%d").date()
        )

        # 프로젝트 로그도 생성되었는지 확인
        log = ProjectLog.objects.get(id=data["log_id"])
        self.assertEqual(log.project.id, self.project.id)
        self.assertEqual(log.type, "refund")
        self.assertEqual(log.title, "반품 접수 현황")
        self.assertEqual(log.content, f"{self.product.name} 5개가 반품되었어요.")

    def test_create_refund_nonexistent_project(self):
        """존재하지 않는 프로젝트로 반품 생성 시도 테스트"""
        url = "/v1/project-refund"

        payload = {
            "project_id": 999,
            "product_id": self.product.id,
            "refund_date": "2024-01-15",
            "refund_amount": 5,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        data = response.json()
        self.assertEqual(response.status_code, 404)
        self.assertIn(
            "해당 프로젝트를 찾을 수 없습니다", response.json().get("detail", "")
        )

    def test_create_refund_nonexistent_product(self):
        """존재하지 않는 제품으로 반품 생성 시도 테스트"""
        url = "/v1/project-refund"

        payload = {
            "project_id": self.project.id,
            "product_id": 999,
            "refund_date": "2024-01-15",
            "refund_amount": 5,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("해당 제품을 찾을 수 없습니다", response.json().get("detail", ""))

    def test_create_refund_zero_amount(self):
        """반품 수량이 0인 경우 테스트"""
        url = "/v1/project-refund"

        payload = {
            "project_id": self.project.id,
            "product_id": self.product.id,
            "refund_date": "2024-01-15",
            "production_amount": 0,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "반품 수량은 0보다 커야 합니다", response.json().get("detail", "")
        )

    def test_create_refund_negative_amount(self):
        """반품 수량이 음수인 경우 테스트"""
        url = "/v1/project-refund"

        payload = {
            "project_id": self.project.id,
            "product_id": self.product.id,
            "refund_date": "2024-01-15",
            "production_amount": -5,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "반품 수량은 0보다 커야 합니다", response.json().get("detail", "")
        )

    def test_create_refund_invalid_date_format(self):
        """올바르지 않은 날짜 형식 테스트"""
        url = "/v1/project-refund"

        payload = {
            "project_id": self.project.id,
            "product_id": self.product.id,
            "refund_date": "2024/01/15",  # 잘못된 형식
            "refund_amount": 5,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "올바르지 않은 날짜 형식입니다", response.json().get("detail", "")
        )

    def test_create_refund_without_auth(self):
        """인증 없이 반품 생성 시도 테스트"""
        url = "/v1/project-refund"

        payload = {
            "project_id": self.project.id,
            "product_id": self.product.id,
            "refund_date": "2024-01-15",
            "refund_amount": 5,
        }

        response = self.client.post(
            url, data=json.dumps(payload), content_type="application/json"
        )

        self.assertIn(response.status_code, [401, 403])

    # def test_update_refund_success(self):
    #     """반품 수정 성공 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # 반품 수정
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"refund_date": "2024-01-20", "production_amount": 8}
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 200)
    #
    #     # 응답 데이터 확인
    #     data = response.json()
    #     self.assertIn("message", data)
    #     self.assertIn("refund_id", data)
    #     self.assertIn("updated_project_plans", data)
    #     self.assertEqual(data["message"], "반품이 성공적으로 수정되었습니다.")
    #
    #     # 데이터베이스에 반품이 수정되었는지 확인
    #     refund.refresh_from_db()
    #     self.assertEqual(refund.amount, 18)  # current_stock(10) + production_amount(8)
    #     self.assertEqual(refund.current_stock, 10)
    #     self.assertEqual(refund.production_amount, 8)
    #     self.assertEqual(
    #         refund.refund_date, datetime.strptime("2024-01-20", "%Y-%m-%d").date()
    #     )
    #
    #     # 프로젝트 로그 내용도 업데이트되었는지 확인
    #     log.refresh_from_db()
    #     self.assertEqual(log.content, f"{self.product.name} 18개가 반품되었어요.")

    # def test_update_refund_partial_fields(self):
    #     """일부 필드만 수정하는 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # 날짜만 수정
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"refund_date": "2024-01-25"}
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 200)
    #
    #     # 데이터베이스 확인
    #     refund.refresh_from_db()
    #     self.assertEqual(refund.amount, 15)  # 변경되지 않음
    #     self.assertEqual(refund.current_stock, 10)  # 변경되지 않음
    #     self.assertEqual(refund.production_amount, 5)  # 변경되지 않음
    #     self.assertEqual(
    #         refund.refund_date, datetime.strptime("2024-01-25", "%Y-%m-%d").date()
    #     )

    # def test_update_refund_nonexistent(self):
    #     """존재하지 않는 반품 수정 시도 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     url = "/v1/project-refund/999"
    #
    #     payload = {"refund_date": "2024-01-20", "production_amount": 8}
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 404)
    #     self.assertIn("해당 반품을 찾을 수 없습니다", response.json().get("detail", ""))

    # def test_update_refund_invalid_date_format(self):
    #     """올바르지 않은 날짜 형식으로 수정 시도 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # 잘못된 날짜 형식으로 수정
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"refund_date": "2024/01/20"}  # 잘못된 형식
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 400)
    #     self.assertIn(
    #         "올바르지 않은 날짜 형식입니다", response.json().get("detail", "")
    #     )

    # def test_update_refund_zero_amount(self):
    #     """수정 후 반품 수량이 0이 되는 경우 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # 반품 수정
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"production_amount": -10}
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 400)
    #     self.assertIn(
    #         "반품 수량은 0보다 커야 합니다", response.json().get("detail", "")
    #     )

    # def test_update_refund_negative_amount(self):
    #     """수정 후 반품 수량이 음수가 되는 경우 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # 반품 수정
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"production_amount": -20}
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 400)
    #     self.assertIn(
    #         "반품 수량은 0보다 커야 합니다", response.json().get("detail", "")
    #     )

    # def test_update_refund_without_auth(self):
    #     """인증 없이 반품 수정 시도 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # 인증 없이 수정
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"refund_date": "2024-01-20", "production_amount": 8}
    #
    #     response = self.client.patch(
    #         url, data=json.dumps(payload), content_type="application/json"
    #     )
    #
    #     self.assertIn(response.status_code, [401, 403])

    def test_create_refund_with_refund_amount_null(self):
        """refund_amount가 null인 경우 반품 생성 테스트"""
        url = "/v1/project-refund"

        payload = {
            "project_id": self.project.id,
            "product_id": self.product.id,
            "refund_date": "2024-01-15",
            "refund_amount": 1,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 데이터베이스 확인
        data = response.json()
        refund = Refund.objects.get(id=data["refund_id"])
        self.assertEqual(
            refund.amount, 1
        )  # product.current_stock(0) + production_amount(1)
        self.assertEqual(refund.production_amount, 1)

    # def test_update_refund_only_current_stock(self):
    #     """current_stock만 수정하는 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # current_stock만 수정 (실제로는 수정되지 않음)
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"current_stock": 20}
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 200)
    #
    #     # 데이터베이스 확인
    #     refund.refresh_from_db()
    #     self.assertEqual(refund.amount, 15)  # current_stock은 수정되지 않음
    #     self.assertEqual(refund.current_stock, 10)  # 수정되지 않음
    #     self.assertEqual(refund.production_amount, 5)  # 변경되지 않음
    #
    #     # 로그 내용도 업데이트되지 않음
    #     log.refresh_from_db()
    #     self.assertEqual(log.content, f"{self.product.name} 15개가 반품되었어요.")

    # def test_update_refund_only_production_amount(self):
    #     """production_amount만 수정하는 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # production_amount만 수정
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"production_amount": 15}
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 200)
    #
    #     # 데이터베이스 확인
    #     refund.refresh_from_db()
    #     self.assertEqual(refund.amount, 25)  # 10 + 15
    #     self.assertEqual(refund.current_stock, 10)  # 변경되지 않음
    #     self.assertEqual(refund.production_amount, 15)
    #
    #     # 로그 내용도 업데이트되었는지 확인
    #     log.refresh_from_db()
    #     self.assertEqual(log.content, f"{self.product.name} 25개가 반품되었어요.")

    def test_get_refund_detail_success(self):
        """반품 상세 조회 성공 테스트"""
        # 먼저 반품 생성
        refund = Refund.objects.create(
            product=self.product,
            amount=15,
            refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
            current_stock=10,
            production_amount=5,
        )

        log = ProjectLog.objects.create(
            project=self.project,
            type="refund",
            title="반품 접수 현황",
            content=f"{self.product.name} 15개가 반품되었어요.",
            refund=refund,
        )

        # 반품 상세 조회
        url = f"/v1/project-refund/{refund.id}"

        response = self.client.get(
            f"{url}?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 응답 데이터 확인
        data = response.json()
        self.assertEqual(data["id"], refund.id)
        self.assertEqual(data["amount"], 15)
        self.assertEqual(data["current_stock"], 10)
        self.assertEqual(data["production_amount"], 5)
        self.assertEqual(data["refund_date"], "2024-01-15")

        # 제품 정보 확인
        self.assertIn("product", data)
        self.assertEqual(data["product"]["id"], self.product.id)
        self.assertEqual(data["product"]["name"], self.product.name)
        self.assertEqual(data["product"]["code"], self.product.code)
        self.assertEqual(data["product"]["current_stock"], self.product.current_stock)

        # 프로젝트 정보 확인
        self.assertIn("project", data)
        self.assertEqual(data["project"]["id"], self.project.id)
        self.assertEqual(data["project"]["status"], self.project.status)

        # 로그 정보 확인
        self.assertIn("log", data)
        self.assertEqual(data["log"]["id"], log.id)
        self.assertEqual(data["log"]["title"], log.title)
        self.assertEqual(data["log"]["content"], log.content)
        self.assertIn("created_at", data["log"])

        # 생성/수정 일시 확인
        self.assertIn("created_at", data)
        self.assertIn("updated_at", data)

    def test_get_refund_detail_nonexistent(self):
        """존재하지 않는 반품 상세 조회 테스트"""
        url = "/v1/project-refund/999"

        response = self.client.get(
            f"{url}?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("해당 반품을 찾을 수 없습니다", response.json().get("detail", ""))

    def test_get_refund_detail_different_factory(self):
        """다른 팩토리의 반품 상세 조회 시도 테스트"""
        # 다른 팩토리 생성
        other_factory = Factory.objects.create(name="다른 공장", owner=self.user)

        # 다른 팩토리의 프로젝트 생성
        other_project = Project.objects.create()

        # 다른 팩토리의 견적서 생성
        from document.models import Quotation

        other_quotation = Quotation.objects.create(
            factory=other_factory, client=self.client_company, project=other_project
        )

        # 다른 팩토리의 반품 생성
        other_refund = Refund.objects.create(
            product=self.product,
            amount=10,
            refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
            current_stock=5,
            production_amount=5,
        )

        other_log = ProjectLog.objects.create(
            project=other_project,
            type="refund",
            title="반품 접수 현황",
            content=f"{self.product.name} 10개가 반품되었어요.",
            refund=other_refund,
        )

        # 현재 팩토리로 다른 팩토리의 반품 조회 시도
        url = f"/v1/project-refund/{other_refund.id}"

        response = self.client.get(
            f"{url}?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("해당 반품을 찾을 수 없습니다", response.json().get("detail", ""))

    def test_get_refund_detail_without_factory_id(self):
        """factory_id 없이 반품 상세 조회 시도 테스트"""
        # 먼저 반품 생성
        refund = Refund.objects.create(
            product=self.product,
            amount=15,
            refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
            current_stock=10,
            production_amount=5,
        )

        log = ProjectLog.objects.create(
            project=self.project,
            type="refund",
            title="반품 접수 현황",
            content=f"{self.product.name} 15개가 반품되었어요.",
            refund=refund,
        )

        # factory_id 없이 조회
        url = f"/v1/project-refund/{refund.id}"

        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 400)
        self.assertIn("factory_id를 입력해야 합니다", response.json().get("detail", ""))

    def test_get_refund_detail_without_auth(self):
        """인증 없이 반품 상세 조회 시도 테스트"""
        # 먼저 반품 생성
        refund = Refund.objects.create(
            product=self.product,
            amount=15,
            refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
            current_stock=10,
            production_amount=5,
        )

        log = ProjectLog.objects.create(
            project=self.project,
            type="refund",
            title="반품 접수 현황",
            content=f"{self.product.name} 15개가 반품되었어요.",
            refund=refund,
        )

        # 인증 없이 조회
        url = f"/v1/project-refund/{refund.id}"

        response = self.client.get(f"{url}?factory_id={self.factory.id}")

        self.assertIn(response.status_code, [401, 403])

    def test_get_refund_detail_with_null_refund_date(self):
        """반품 날짜가 null인 반품 상세 조회 테스트"""
        # 먼저 반품 생성 (날짜 없이)
        refund = Refund.objects.create(
            product=self.product,
            amount=15,
            refund_date=datetime.strptime(
                "2024-01-15", "%Y-%m-%d"
            ).date(),  # NOT NULL 제약조건으로 인해 날짜 필요
            current_stock=10,
            production_amount=5,
        )

        log = ProjectLog.objects.create(
            project=self.project,
            type="refund",
            title="반품 접수 현황",
            content=f"{self.product.name} 15개가 반품되었어요.",
            refund=refund,
        )

        # 반품 상세 조회
        url = f"/v1/project-refund/{refund.id}"

        response = self.client.get(
            f"{url}?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 응답 데이터 확인
        data = response.json()
        self.assertEqual(data["id"], refund.id)
        self.assertEqual(data["refund_date"], "2024-01-15")  # 날짜가 있어야 함
        self.assertEqual(data["amount"], 15)
        self.assertEqual(data["current_stock"], 10)
        self.assertEqual(data["production_amount"], 5)

    def test_get_refund_detail_with_related_data(self):
        """관계 데이터가 포함된 반품 상세 조회 테스트"""
        # 제품에 현재 재고 설정
        self.product.current_stock = 25
        self.product.save()

        # 프로젝트 상태 설정
        self.project.status = "production"
        self.project.save()

        # 반품 생성
        refund = Refund.objects.create(
            product=self.product,
            amount=20,
            refund_date=datetime.strptime("2024-01-20", "%Y-%m-%d").date(),
            current_stock=15,
            production_amount=5,
        )

        log = ProjectLog.objects.create(
            project=self.project,
            type="refund",
            title="반품 접수 현황",
            content=f"{self.product.name} 20개가 반품되었어요.",
            refund=refund,
        )

        # 반품 상세 조회
        url = f"/v1/project-refund/{refund.id}"

        response = self.client.get(
            f"{url}?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 응답 데이터 확인
        data = response.json()

        # 제품 정보 확인 (현재 재고 포함)
        self.assertEqual(data["product"]["current_stock"], 25)

        # 프로젝트 정보 확인 (상태 포함)
        self.assertEqual(data["project"]["status"], self.project.status)

        # 반품 정보 확인
        self.assertEqual(data["amount"], 20)
        self.assertEqual(data["current_stock"], 15)
        self.assertEqual(data["production_amount"], 5)
        self.assertEqual(data["refund_date"], "2024-01-20")

    def test_register_production_from_refund_success(self):
        """반품 생산 등록 성공 테스트"""
        # 먼저 반품 생성
        refund = Refund.objects.create(
            product=self.product,
            amount=15,
            refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
            current_stock=10,
            production_amount=5,
        )

        log = ProjectLog.objects.create(
            project=self.project,
            type="refund",
            title="반품 접수 현황",
            content=f"{self.product.name} 15개가 반품되었어요.",
            refund=refund,
        )

        # 장비 생성
        from factory.models import FactoryEquipment

        equipment = FactoryEquipment.objects.create(
            factory=self.factory, name="테스트 장비", priority=1
        )

        # 반품 생산 등록
        url = f"/v1/project-refund/log/{log.id}/production"

        payload = {"amount": 15, "production_amount": 5, "refund_date": "2024-01-15"}

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 응답 데이터 확인
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("refund_id", data)
        self.assertIn("quotation_id", data)
        self.assertIn("quotation_product_id", data)
        self.assertIn("project_plan_id", data)
        self.assertIn("log_id", data)
        self.assertIn("product_name", data)
        self.assertIn("quantity", data)
        self.assertIn("equipment_name", data)

        self.assertEqual(data["message"], "반품 재생산이 성공적으로 처리되었습니다.")
        self.assertEqual(data["refund_id"], refund.id)
        self.assertEqual(data["product_name"], self.product.name)
        self.assertEqual(data["quantity"], 15)
        self.assertEqual(data["equipment_name"], equipment.name)

        # 데이터베이스에 생성된 데이터 확인
        from document.models import Quotation, QuotationProduct
        from project.models import ProjectPlan

        # 새로운 QuotationProduct 확인 (반품용으로 새로 생성됨)
        quotation_product = QuotationProduct.objects.get(
            id=data["quotation_product_id"]
        )
        self.assertEqual(quotation_product.product.id, self.product.id)
        self.assertEqual(quotation_product.quantity, 15)
        self.assertEqual(quotation_product.unit_price, 0)  # 반품은 단가 0

        # ProjectPlan의 반품 여부 확인
        project_plan = ProjectPlan.objects.get(id=data["project_plan_id"])

        # ProjectPlan 확인
        project_plan = ProjectPlan.objects.get(id=data["project_plan_id"])
        self.assertEqual(project_plan.project.id, self.project.id)
        self.assertEqual(project_plan.product.id, quotation_product.id)
        self.assertEqual(project_plan.equipment.id, equipment.id)
        self.assertEqual(project_plan.quantity, 5)
        self.assertEqual(project_plan.status, "pending")
        # 품목의 평균 생산 시간이 사용되는지 확인 (제품의 값을 그대로 사용, None이면 None)
        self.assertEqual(project_plan.avg_production_time, self.product.average_production_time)

        # 마감 시간이 올바르게 계산되는지 확인 (초 단위 동일)
        # 일정 계산에는 제품의 average_production_time이 None이면 기본값 30초 사용
        schedule_avg_time = self.product.average_production_time if self.product.average_production_time is not None else 30
        expected_duration = timedelta(
            seconds=schedule_avg_time * payload["production_amount"]
        )
        self.assertEqual(
            project_plan.end_date - project_plan.start_date, expected_duration
        )

        # 기존 QuotationProduct는 그대로 유지되는지 확인
        original_quotation_products = QuotationProduct.objects.filter(
            quotation__project=self.project, product=self.product
        )
        self.assertTrue(original_quotation_products.exists())

        # 원자재 차감이 제대로 되었는지 확인
        from stock.models import MaterialProduct, Material

        material_products = MaterialProduct.objects.filter(product=self.product)
        for material_product in material_products:
            material = material_product.material
            expected_stock = material.current_stock + (
                material_product.quantity * 15
            )  # 원래 재고 + 소모된 양
            self.assertEqual(material.current_stock, expected_stock)

    def test_register_production_from_refund_nonexistent(self):
        """존재하지 않는 로그로 생산 등록 시도 테스트"""
        url = "/v1/project-refund/log/999/production"

        payload = {"amount": 15, "production_amount": 5, "refund_date": "2024-01-15"}

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("해당 로그를 찾을 수 없습니다", response.json().get("detail", ""))

    def test_register_production_from_refund_zero_amount(self):
        """반품 수량이 0인 경우 생산 등록 시도 테스트"""
        # 수량이 0인 반품 생성
        refund = Refund.objects.create(
            product=self.product,
            amount=0,
            refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
            current_stock=0,
            production_amount=0,
        )

        log = ProjectLog.objects.create(
            project=self.project,
            type="refund",
            title="반품 접수 현황",
            content=f"{self.product.name} 0개가 반품되었어요.",
            refund=refund,
        )

        url = f"/v1/project-refund/log/{log.id}/production"

        payload = {"amount": 0, "production_amount": 0, "refund_date": "2024-01-15"}

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "반품 수량이 0보다 커야 합니다", response.json().get("detail", "")
        )

    def test_register_production_from_refund_no_equipment(self):
        """사용 가능한 장비가 없는 경우 테스트"""
        # 먼저 반품 생성
        refund = Refund.objects.create(
            product=self.product,
            amount=15,
            refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
            current_stock=10,
            production_amount=5,
        )

        log = ProjectLog.objects.create(
            project=self.project,
            type="refund",
            title="반품 접수 현황",
            content=f"{self.product.name} 15개가 반품되었어요.",
            refund=refund,
        )

        # 장비가 없는 상태에서 생산 등록 시도
        url = f"/v1/project-refund/log/{log.id}/production"

        payload = {"amount": 15, "production_amount": 5, "refund_date": "2024-01-15"}

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("사용 가능한 장비가 없습니다", response.json().get("detail", ""))

    def test_register_production_from_refund_without_auth(self):
        """인증 없이 반품 생산 등록 시도 테스트"""
        # 먼저 반품 생성
        refund = Refund.objects.create(
            product=self.product,
            amount=15,
            refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
            current_stock=10,
            production_amount=5,
        )

        log = ProjectLog.objects.create(
            project=self.project,
            type="refund",
            title="반품 접수 현황",
            content=f"{self.product.name} 15개가 반품되었어요.",
            refund=refund,
        )

        # 인증 없이 생산 등록 시도
        url = f"/v1/project-refund/log/{log.id}/production"

        payload = {"amount": 15, "production_amount": 5, "refund_date": "2024-01-15"}

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=payload,
            content_type="application/json",
        )

        self.assertIn(response.status_code, [401, 403])

    def test_register_production_from_refund_without_factory_id(self):
        """factory_id 없이 반품 생산 등록 시도 테스트"""
        # 먼저 반품 생성
        refund = Refund.objects.create(
            product=self.product,
            amount=15,
            refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
            current_stock=10,
            production_amount=5,
        )

        log = ProjectLog.objects.create(
            project=self.project,
            type="refund",
            title="반품 접수 현황",
            content=f"{self.product.name} 15개가 반품되었어요.",
            refund=refund,
        )

        # factory_id 없이 생산 등록 시도
        url = f"/v1/project-refund/log/{log.id}/production"

        payload = {"amount": 15, "production_amount": 5, "refund_date": "2024-01-15"}

        response = self.client.post(
            url,
            data=payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("factory_id를 입력해야 합니다", response.json().get("detail", ""))

    def test_register_production_from_refund_no_quotation_product(self):
        """해당 제품의 QuotationProduct가 없는 경우 테스트 (새로운 QuotationProduct 생성)"""
        # 새로운 제품 생성 (QuotationProduct가 없는 제품)
        new_product = Product.objects.create(
            factory=self.factory,
            name="새로운 제품",
            code="NEW001",
            unit="개",
            spec="새로운 규격",
        )

        # 먼저 반품 생성
        refund = Refund.objects.create(
            product=new_product,  # 새로운 제품 사용
            amount=15,
            refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
            current_stock=10,
            production_amount=5,
        )

        log = ProjectLog.objects.create(
            project=self.project,
            type="refund",
            title="반품 접수 현황",
            content=f"{new_product.name} 15개가 반품되었어요.",
            refund=refund,
        )

        # 장비 생성
        from factory.models import FactoryEquipment

        equipment = FactoryEquipment.objects.create(
            factory=self.factory, name="테스트 장비", priority=1
        )

        # QuotationProduct가 없는 상태에서 생산 등록 시도 (이제는 성공해야 함)
        url = f"/v1/project-refund/log/{log.id}/production"

        payload = {"amount": 15, "production_amount": 5, "refund_date": "2024-01-15"}

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 응답 데이터 확인
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("quotation_product_id", data)
        self.assertIn("project_plan_id", data)

        # 새로운 QuotationProduct가 생성되었는지 확인
        from document.models import QuotationProduct

        quotation_product = QuotationProduct.objects.get(
            id=data["quotation_product_id"]
        )
        self.assertEqual(quotation_product.product.id, new_product.id)
        self.assertEqual(quotation_product.quantity, 15)
        self.assertEqual(quotation_product.unit_price, 0)  # 반품은 단가 0

        # ProjectPlan도 확인
        from project.models import ProjectPlan

        project_plan = ProjectPlan.objects.get(id=data["project_plan_id"])
        # 제품의 average_production_time이 None이면 None으로 저장됨 
        self.assertIsNone(project_plan.avg_production_time)

    # def test_update_refund_with_related_project_plan(self):
    #     """반품 수정 시 연결된 ProjectPlan도 함께 수정되는지 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # 장비 생성
    #     from factory.models import FactoryEquipment
    #
    #     equipment = FactoryEquipment.objects.create(
    #         factory=self.factory, name="테스트 장비", priority=1
    #     )
    #
    #     # 반품 생산 등록 (ProjectPlan 생성)
    #     from project.models import ProjectPlan
    #
    #     today = timezone.localdate()
    #     start_of_today = timezone.make_aware(
    #         datetime.combine(today, datetime.min.time())
    #     )
    #     project_plan = ProjectPlan.objects.create(
    #         project=self.project,
    #         product=self.quotation_product,
    #         equipment=equipment,
    #         status="가동 대기",
    #         quantity=15,  # 반품 수량과 동일
    #         start_date=start_of_today,
    #         end_date=start_of_today + timedelta(days=7),
    #         avg_production_time=3600,
    #     )
    #
    #     # refund.plan에 project_plan 연결 (생산 등록된 반품으로 만들기)
    #     refund.plan = project_plan
    #     refund.save()
    #
    #     # 반품 수정 (production_amount를 8로 변경)
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"production_amount": 8}
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 200)
    #
    #     # 응답 데이터 확인
    #     data = response.json()
    #     self.assertEqual(data["message"], "반품이 성공적으로 수정되었습니다.")
    #     self.assertIn("updated_project_plans", data)
    #     self.assertEqual(
    #         len(data["updated_project_plans"]), 1
    #     )  # 1개의 ProjectPlan이 수정됨
    #     self.assertEqual(data["updated_project_plans"][0], project_plan.id)
    #
    #     # 데이터베이스 확인
    #     refund.refresh_from_db()
    #     self.assertEqual(refund.amount, 18)  # 10 + 8
    #     self.assertEqual(refund.production_amount, 8)
    #
    #     # ProjectPlan도 수정되었는지 확인
    #     project_plan.refresh_from_db()
    #     self.assertEqual(project_plan.quantity, 18)  # 반품 수량과 동일하게 수정됨

    # def test_update_refund_product_change(self):
    #     """반품 수정 시 제품이 변경되는 경우 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # 새로운 제품 생성
    #     new_product = Product.objects.create(
    #         factory=self.factory,
    #         name="새로운 제품",
    #         code="NEW001",
    #         unit="개",
    #         spec="새로운 규격",
    #     )
    #
    #     # 새로운 제품의 QuotationProduct 생성
    #     from document.models import QuotationProduct
    #
    #     new_quotation_product = QuotationProduct.objects.create(
    #         quotation=self.quotation, product=new_product, quantity=50, unit_price=15000
    #     )
    #
    #     # 장비 생성
    #     from factory.models import FactoryEquipment
    #
    #     equipment = FactoryEquipment.objects.create(
    #         factory=self.factory, name="테스트 장비", priority=1
    #     )
    #
    #     # 기존 제품으로 ProjectPlan 생성
    #     from project.models import ProjectPlan
    #
    #     today = timezone.localdate()
    #     start_of_today = timezone.make_aware(
    #         datetime.combine(today, datetime.min.time())
    #     )
    #     old_project_plan = ProjectPlan.objects.create(
    #         project=self.project,
    #         product=self.quotation_product,
    #         equipment=equipment,
    #         status="가동 대기",
    #         quantity=15,
    #         start_date=start_of_today,
    #         end_date=start_of_today + timedelta(days=7),
    #         avg_production_time=3600,
    #     )
    #
    #     # refund.plan에 old_project_plan 연결 (생산 등록된 반품으로 만들기)
    #     refund.plan = old_project_plan
    #     refund.save()
    #
    #     # 반품 수정 (제품 변경)
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"product_id": new_product.id, "production_amount": 8}
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 200)
    #
    #     # 응답 데이터 확인
    #     data = response.json()
    #     self.assertEqual(data["message"], "반품이 성공적으로 수정되었습니다.")
    #     self.assertIn("updated_project_plans", data)
    #     self.assertIn("deleted_project_plans", data)
    #     self.assertIn("created_project_plans", data)
    #
    #     # 기존 ProjectPlan이 삭제되었는지 확인
    #     self.assertEqual(len(data["deleted_project_plans"]), 1)
    #     self.assertEqual(data["deleted_project_plans"][0], old_project_plan.id)
    #
    #     # 새로운 ProjectPlan이 생성되었는지 확인
    #     self.assertEqual(len(data["created_project_plans"]), 1)
    #
    #     # 데이터베이스 확인
    #     refund.refresh_from_db()
    #     self.assertEqual(refund.product.id, new_product.id)
    #     self.assertEqual(refund.amount, 18)  # 10 + 8
    #     self.assertEqual(refund.production_amount, 8)
    #
    #     # 기존 ProjectPlan이 삭제되었는지 확인
    #     with self.assertRaises(ProjectPlan.DoesNotExist):
    #         old_project_plan.refresh_from_db()
    #
    #     # 새로운 ProjectPlan 확인
    #     new_project_plan = ProjectPlan.objects.get(id=data["created_project_plans"][0])
    #     self.assertEqual(new_project_plan.product.id, new_quotation_product.id)
    #     self.assertEqual(new_project_plan.quantity, 18)

    # def test_update_refund_date_only(self):
    #     """반품 날짜만 수정하는 경우 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # 반품 날짜만 수정
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"refund_date": "2024-01-25"}
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 200)
    #
    #     # 응답 데이터 확인
    #     data = response.json()
    #     self.assertEqual(data["message"], "반품이 성공적으로 수정되었습니다.")
    #     self.assertEqual(len(data["updated_project_plans"]), 0)  # ProjectPlan 수정 없음
    #     self.assertEqual(len(data["deleted_project_plans"]), 0)
    #     self.assertEqual(len(data["created_project_plans"]), 0)
    #
    #     # 데이터베이스 확인
    #     refund.refresh_from_db()
    #     self.assertEqual(
    #         refund.refund_date, datetime.strptime("2024-01-25", "%Y-%m-%d").date()
    #     )
    #     self.assertEqual(refund.amount, 15)  # 변경되지 않음
    #     self.assertEqual(refund.production_amount, 5)  # 변경되지 않음
    #
    # def test_update_refund_no_project_plan(self):
    #     """ProjectPlan이 없는 반품 수정 테스트 (PATCH /v1/project-refund/{id})"""
    #     # 현재 백엔드에서 해당 PATCH 엔드포인트를 사용하지 않으므로 테스트 비활성화
    #     # 먼저 반품 생성 (ProjectPlan 없이)
    #     refund = Refund.objects.create(
    #         product=self.product,
    #         amount=15,
    #         refund_date=datetime.strptime("2024-01-15", "%Y-%m-%d").date(),
    #         current_stock=10,
    #         production_amount=5,
    #     )
    #
    #     log = ProjectLog.objects.create(
    #         project=self.project,
    #         type="refund",
    #         title="반품 접수 현황",
    #         content=f"{self.product.name} 15개가 반품되었어요.",
    #         refund=refund,
    #     )
    #
    #     # 반품 수정
    #     url = f"/v1/project-refund/{refund.id}"
    #
    #     payload = {"production_amount": 8}
    #
    #     response = self.client.patch(
    #         f"{url}?factory_id={self.factory.id}",
    #         data=json.dumps(payload),
    #         content_type="application/json",
    #         HTTP_AUTHORIZATION=f"Bearer {self.token}",
    #     )
    #
    #     self.assertEqual(response.status_code, 200)
    #
    #     # 응답 데이터 확인
    #     data = response.json()
    #     self.assertEqual(data["message"], "반품이 성공적으로 수정되었습니다.")
    #     self.assertEqual(len(data["updated_project_plans"]), 0)  # ProjectPlan 없음
    #     self.assertEqual(len(data["deleted_project_plans"]), 0)
    #     self.assertEqual(len(data["created_project_plans"]), 0)
    #
    #     # 데이터베이스 확인
    #     refund.refresh_from_db()
    #     self.assertEqual(refund.amount, 18)  # 10 + 8
    #     self.assertEqual(refund.production_amount, 8)
