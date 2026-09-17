import jwt
from datetime import timedelta, date, datetime
from django.test import TestCase
from django.conf import settings
from user.models import User
from factory.models import Factory, FactoryMember, FactoryEquipment
from project.models import Project, ProjectPlan
from document.models import Quotation, QuotationProduct
from stock.models import Product
from unittest.mock import patch, AsyncMock


class SchedulingAPITestCase(TestCase):
    def setUp(self):
        """테스트 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123"
        )

        # 공장 생성
        self.factory = Factory.objects.create(
            name="테스트 공장", owner=self.user, business_address="서울시 강남구"
        )

        # FactoryMember 생성
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )

        # 설비 생성
        self.equipment = FactoryEquipment.objects.create(
            factory=self.factory, name="테스트 설비", priority=1
        )

        # 제품 생성
        self.product = Product.objects.create(
            factory=self.factory,
            name="테스트 제품",
            code="TEST001",
            unit="개",
            spec="테스트 규격",
        )

        # 프로젝트 생성 (pending 상태로 설정하여 알림 대상이 되도록)
        self.project = Project.objects.create(
            name="테스트 프로젝트", status=Project.ProjectStatus.pending
        )

        # 견적서 생성
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            project=self.project,
            due_date=date.today() + timedelta(days=2),  # 2일 후 마감
            due_date_notification=False,
        )

        # 견적서 제품 생성
        self.quotation_product = QuotationProduct.objects.create(
            quotation=self.quotation, product=self.product, quantity=10, unit_price=5000
        )

        # 프로젝트 계획 생성
        self.project_plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.production,
            quantity=10,
            start_date=datetime.now() - timedelta(days=1),
            end_date=datetime.now() - timedelta(hours=1),  # 1시간 전 마감
            avg_production_time=3600,
            end_notification=False,
        )

        self.token = self.generate_jwt_token()
        self.headers = {
            "HTTP_AUTHORIZATION": f"Bearer {self.token}",
            "X-Scheduling-Key": settings.SCHEDULING_SECRET_KEY,
        }

    def generate_jwt_token(self):
        return jwt.encode(
            {"user_id": self.user.id, "exp": datetime.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )


class ProjectDeadlineNotificationTestCase(SchedulingAPITestCase):
    """프로젝트 납기일 알림 테스트"""

    def test_project_deadline_notification_no_due_quotations(self):
        """납기일이 3일 이내인 견적서가 없는 경우 테스트"""
        # 기존 견적서의 납기일을 10일 후로 변경
        self.quotation.due_date = date.today() + timedelta(days=10)
        self.quotation.save()

        url = "/v1/scheduling/project/deadline"

        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            response = self.client.post(url, headers=self.headers)

            self.assertEqual(response.status_code, 200)
            data = response.json()

            # 처리된 견적서가 없어야 함
            self.assertEqual(data["quotations"], 0)

            # 알림이 전송되지 않았어야 함
            mock_send.assert_not_called()

    def test_project_deadline_notification_already_notified(self):
        """이미 알림이 전송된 견적서는 재전송하지 않는 테스트"""
        # due_date_notification을 True로 설정
        self.quotation.due_date_notification = True
        self.quotation.save()

        url = "/v1/scheduling/project/deadline"

        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            response = self.client.post(url, headers=self.headers)

            self.assertEqual(response.status_code, 200)
            data = response.json()

            # 처리된 견적서가 없어야 함
            self.assertEqual(data["quotations"], 0)

            # 알림이 전송되지 않았어야 함
            mock_send.assert_not_called()

    def test_project_deadline_notification_without_scheduling_key(self):
        """스케줄링 키 없이 접근하는 경우 테스트"""
        url = "/v1/scheduling/project/deadline"
        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

        response = self.client.post(url, **headers)

        self.assertEqual(response.status_code, 401)

    def test_project_deadline_notification_invalid_scheduling_key(self):
        """잘못된 스케줄링 키로 접근하는 경우 테스트"""
        url = "/v1/scheduling/project/deadline"
        headers = {
            "HTTP_AUTHORIZATION": f"Bearer {self.token}",
            "X-Scheduling-Key": "invalid_key",
        }

        response = self.client.post(url, headers=headers)

        self.assertEqual(response.status_code, 403)

    def test_project_deadline_notification_quotation_status_excluded(self):
        """quotation 상태의 프로젝트는 알림 대상에서 제외되는 테스트"""
        # 프로젝트 상태를 quotation으로 변경
        self.project.status = Project.ProjectStatus.quotation
        self.project.save()

        url = "/v1/scheduling/project/deadline"

        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            response = self.client.post(url, headers=self.headers)

            self.assertEqual(response.status_code, 200)
            data = response.json()

            # quotation 상태는 제외되므로 처리된 견적서가 없어야 함
            self.assertEqual(data["quotations"], 0)

            # 알림이 전송되지 않았어야 함
            mock_send.assert_not_called()

    def test_project_deadline_notification_confirmed_status_excluded(self):
        """confirmed 상태의 프로젝트는 알림 대상에서 제외되는 테스트"""
        # 프로젝트 상태를 confirmed로 변경
        self.project.status = Project.ProjectStatus.confirmed
        self.project.save()

        url = "/v1/scheduling/project/deadline"

        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            response = self.client.post(url, headers=self.headers)

            self.assertEqual(response.status_code, 200)
            data = response.json()

            # confirmed 상태는 제외되므로 처리된 견적서가 없어야 함
            self.assertEqual(data["quotations"], 0)

            # 알림이 전송되지 않았어야 함
            mock_send.assert_not_called()

    def test_project_deadline_notification_valid_statuses(self):
        """유효한 프로젝트 상태들에 대한 알림 테스트"""
        valid_statuses = [
            Project.ProjectStatus.pending,
            Project.ProjectStatus.production,
            Project.ProjectStatus.manufactured,
            Project.ProjectStatus.delivery,
        ]

        for status in valid_statuses:
            with self.subTest(status=status):
                # 새 프로젝트와 견적서 생성
                project = Project.objects.create(
                    name=f"테스트 프로젝트 {status}", status=status
                )
                quotation = Quotation.objects.create(
                    factory=self.factory,
                    project=project,
                    due_date=date.today() + timedelta(days=2),
                    due_date_notification=False,
                )

                url = "/v1/scheduling/project/deadline"

                with patch(
                    "websocket.utils.send_notification_to_factory",
                    new_callable=AsyncMock,
                ) as mock_send:
                    mock_send.return_value = True

                    response = self.client.post(url, headers=self.headers)

                    self.assertEqual(response.status_code, 200)
                    data = response.json()

                    # 해당 상태는 알림 대상에 포함되므로 처리되어야 함
                    # (기존 pending 프로젝트 + 새로 생성한 프로젝트 = 최소 2개)
                    self.assertGreaterEqual(data["quotations"], 1)

                # 테스트 데이터 정리
                quotation.delete()
                project.delete()


class ProjectPlanEndNotificationTestCase(SchedulingAPITestCase):
    """프로젝트 생산 계획 마감 알림 테스트"""

    def test_project_plan_end_notification_success(self):
        """프로젝트 생산 계획 마감 알림 성공 테스트"""
        url = "/v1/scheduling/project-plan/end"

        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = True

            response = self.client.post(url, headers=self.headers)

            self.assertEqual(response.status_code, 200)
            data = response.json()

            # 응답 데이터 확인
            self.assertIn("plans", data)
            self.assertEqual(data["plans"], 1)

            # 알림이 전송되었는지 확인
            # mock_send.assert_called_once_with(
            #     factory_id=self.factory.id,
            #     notification_type=Notification.NotificationType.completed,
            #     notification_case=Notification.NotificationCase.product_completed,
            #     content=f"{self.product.name} 생산 완료",
            # )

            # 프로젝트 계획의 end_notification이 True로 변경되었는지 확인
            self.project_plan.refresh_from_db()
            self.assertTrue(self.project_plan.end_notification)

    def test_project_plan_end_notification_no_overdue_plans(self):
        """마감 예정일이 지나지 않은 계획들만 있는 경우 테스트"""
        # 프로젝트 계획의 마감일을 미래로 변경
        self.project_plan.end_date = datetime.now() + timedelta(days=1)
        self.project_plan.save()

        url = "/v1/scheduling/project-plan/end"

        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            response = self.client.post(url, headers=self.headers)

            self.assertEqual(response.status_code, 200)
            data = response.json()

            # 처리된 계획이 없어야 함
            self.assertEqual(data["plans"], 0)

            # 알림이 전송되지 않았어야 함
            mock_send.assert_not_called()

    def test_project_plan_end_notification_completed_plan(self):
        """이미 완료된 계획은 알림 대상에서 제외되는 테스트"""
        # 프로젝트 계획을 완료 상태로 변경
        self.project_plan.status = ProjectPlan.ProductionStatus.completed
        self.project_plan.save()

        url = "/v1/scheduling/project-plan/end"

        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            response = self.client.post(url, headers=self.headers)

            self.assertEqual(response.status_code, 200)
            data = response.json()

            # 처리된 계획이 없어야 함
            self.assertEqual(data["plans"], 0)

            # 알림이 전송되지 않았어야 함
            mock_send.assert_not_called()

    def test_project_plan_end_notification_already_notified(self):
        """이미 알림이 전송된 계획은 재전송하지 않는 테스트"""
        # end_notification을 True로 설정
        self.project_plan.end_notification = True
        self.project_plan.save()

        url = "/v1/scheduling/project-plan/end"

        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            response = self.client.post(url, headers=self.headers)

            self.assertEqual(response.status_code, 200)
            data = response.json()

            # 처리된 계획이 없어야 함
            self.assertEqual(data["plans"], 0)

            # 알림이 전송되지 않았어야 함
            mock_send.assert_not_called()

    def test_project_plan_end_notification_non_production_status(self):
        """생산 중이 아닌 상태의 계획은 알림 대상에서 제외되는 테스트"""
        # 프로젝트 계획 상태를 대기로 변경
        self.project_plan.status = ProjectPlan.ProductionStatus.pending
        self.project_plan.save()

        url = "/v1/scheduling/project-plan/end"

        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            response = self.client.post(url, headers=self.headers)

            self.assertEqual(response.status_code, 200)
            data = response.json()

            # 처리된 계획이 없어야 함
            self.assertEqual(data["plans"], 0)

            # 알림이 전송되지 않았어야 함
            mock_send.assert_not_called()

    def test_project_plan_end_notification_without_scheduling_key(self):
        """스케줄링 키 없이 접근하는 경우 테스트"""
        url = "/v1/scheduling/project-plan/end"
        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

        response = self.client.post(url, **headers)

        self.assertEqual(response.status_code, 401)

    def test_project_plan_end_notification_invalid_scheduling_key(self):
        """잘못된 스케줄링 키로 접근하는 경우 테스트"""
        url = "/v1/scheduling/project-plan/end"
        headers = {
            "HTTP_AUTHORIZATION": f"Bearer {self.token}",
            "X-Scheduling-Key": "invalid_key",
        }

        response = self.client.post(url, headers=headers)

        self.assertEqual(response.status_code, 403)


class SchedulingDecoratorsTestCase(TestCase):
    """스케줄링 데코레이터 테스트"""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123"
        )
        self.token = jwt.encode(
            {"user_id": self.user.id, "exp": datetime.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def test_scheduling_only_decorator_success(self):
        """scheduling_only 데코레이터 성공 테스트"""
        url = "/v1/scheduling/project/deadline"
        headers = {
            "HTTP_AUTHORIZATION": f"Bearer {self.token}",
            "X-Scheduling-Key": settings.SCHEDULING_SECRET_KEY,
        }

        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ):
            response = self.client.post(url, headers=headers)

            # 401이나 403이 아닌 다른 응답이어야 함 (키 검증 통과)
            self.assertNotEqual(response.status_code, 401)

    def test_scheduling_only_decorator_missing_key(self):
        """scheduling_only 데코레이터 키 누락 테스트"""
        url = "/v1/scheduling/project/deadline"
        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

        response = self.client.post(url, **headers)

        self.assertEqual(response.status_code, 401)

    def test_scheduling_only_decorator_invalid_key(self):
        """scheduling_only 데코레이터 잘못된 키 테스트"""
        url = "/v1/scheduling/project/deadline"
        headers = {
            "HTTP_AUTHORIZATION": f"Bearer {self.token}",
            "X-Scheduling-Key": "wrong_key",
        }

        response = self.client.post(url, headers=headers)
        data = response.json()
        self.assertEqual(response.status_code, 403)


class SchedulingIntegrationTestCase(TestCase):
    """스케줄링 통합 테스트"""

    def setUp(self):
        """테스트 설정"""
        # 기본 사용자 및 공장 설정
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123"
        )

        self.factory = Factory.objects.create(
            name="통합테스트 공장", owner=self.user, business_address="서울시 강남구"
        )

        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )

        self.equipment = FactoryEquipment.objects.create(
            factory=self.factory, name="통합테스트 설비", priority=1
        )

        self.product = Product.objects.create(
            factory=self.factory, name="통합테스트 제품", code="INT001", unit="개"
        )

        self.project = Project.objects.create(
            name="통합테스트 프로젝트", status=Project.ProjectStatus.pending
        )

        self.token = jwt.encode(
            {"user_id": self.user.id, "exp": datetime.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

        self.headers = {
            "HTTP_AUTHORIZATION": f"Bearer {self.token}",
            "X-Scheduling-Key": settings.SCHEDULING_SECRET_KEY,
        }

    def test_end_to_end_deadline_notification_flow(self):
        """납기일 알림 전체 플로우 테스트"""
        # 1. 납기일이 임박한 견적서 생성
        quotation = Quotation.objects.create(
            factory=self.factory,
            project=self.project,
            due_date=date.today() + timedelta(days=2),
            due_date_notification=False,
        )

        # 2. 프로젝트명 설정
        self.project.name = "통합테스트 프로젝트"
        self.project.save()

        # 3. 납기일 알림 API 호출
        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = True

            response = self.client.post(
                "/v1/scheduling/project/deadline", headers=self.headers
            )

            # 4. 응답 확인
            self.assertEqual(response.status_code, 200)
            data = response.json()
            # print(
            #     "🐍 File: tests/test_api.py | Line: 608 | test_end_to_end_deadline_notification_flow ~ data",
            #     data,
            # )
            self.assertEqual(data["quotations"], 1)

            # # 5. 알림 전송 확인
            # mock_send.assert_called_once_with(
            #     factory_id=self.factory.id,
            #     notification_type=Notification.NotificationType.information,
            #     notification_case=Notification.NotificationCase.due_date_approaching,
            #     content=f"{self.project.name} 납기일이 3일 남았어요.",
            # )

            # 6. 데이터베이스 상태 확인
            quotation.refresh_from_db()
            self.assertTrue(quotation.due_date_notification)

    def test_end_to_end_plan_end_notification_flow(self):
        """생산 계획 마감 알림 전체 플로우 테스트"""
        # 1. 견적서 제품 생성
        quotation = Quotation.objects.create(
            factory=self.factory,
            project=self.project,
            due_date=date.today() + timedelta(days=5),
        )

        quotation_product = QuotationProduct.objects.create(
            quotation=quotation, product=self.product, quantity=15, unit_price=3000
        )

        # 2. 마감 예정일이 지난 생산 계획 생성
        project_plan = ProjectPlan.objects.create(
            project=self.project,
            product=quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.production,
            quantity=15,
            start_date=datetime.now() - timedelta(days=1),
            end_date=datetime.now() - timedelta(minutes=30),  # 30분 전 마감
            avg_production_time=2400,
            end_notification=False,
        )

        # 3. 생산 계획 마감 알림 API 호출
        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = True

            response = self.client.post(
                "/v1/scheduling/project-plan/end", headers=self.headers
            )

            # 4. 응답 확인
            data = response.json()

            self.assertEqual(response.status_code, 200)
            self.assertEqual(data["plans"], 1)

            # 5. 알림 전송 확인
            # mock_send.assert_called_once_with(
            #     factory_id=self.factory.id,
            #     notification_type=Notification.NotificationType.completed,
            #     notification_case=Notification.NotificationCase.product_completed,
            #     content=f"{self.product.name} 생산 완료",
            # )

            # 6. 데이터베이스 상태 확인
            project_plan.refresh_from_db()
            self.assertTrue(project_plan.end_notification)

    def test_multiple_notifications_scenario(self):
        """여러 알림이 동시에 처리되는 시나리오 테스트"""
        # 1. 납기일 임박한 견적서 2개 생성
        quotation1 = Quotation.objects.create(
            factory=self.factory,
            project=self.project,
            due_date=date.today() + timedelta(days=1),
            due_date_notification=False,
        )

        project2 = Project.objects.create(
            name="두 번째 프로젝트", status=Project.ProjectStatus.production
        )
        quotation2 = Quotation.objects.create(
            factory=self.factory,
            project=project2,
            due_date=date.today() + timedelta(days=2),
            due_date_notification=False,
        )

        # 2. 마감된 생산 계획 2개 생성
        quotation_product1 = QuotationProduct.objects.create(
            quotation=quotation1, product=self.product, quantity=10, unit_price=2000
        )

        quotation_product2 = QuotationProduct.objects.create(
            quotation=quotation2, product=self.product, quantity=20, unit_price=2500
        )

        ProjectPlan.objects.create(
            project=self.project,
            product=quotation_product1,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.production,
            quantity=10,
            start_date=datetime.now() - timedelta(days=1),
            end_date=datetime.now() - timedelta(hours=1),
            avg_production_time=1800,
            end_notification=False,
        )

        ProjectPlan.objects.create(
            project=project2,
            product=quotation_product2,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.production,
            quantity=20,
            start_date=datetime.now() - timedelta(days=2),
            end_date=datetime.now() - timedelta(hours=3),
            avg_production_time=3000,
            end_notification=False,
        )

        with patch(
            "websocket.utils.send_notification_to_factory", new_callable=AsyncMock
        ) as mock_send:
            mock_send.return_value = True

            # 3. 두 API 모두 호출
            deadline_response = self.client.post(
                "/v1/scheduling/project/deadline", headers=self.headers
            )
            plan_end_response = self.client.post(
                "/v1/scheduling/project-plan/end", headers=self.headers
            )

            # 4. 응답 확인
            self.assertEqual(deadline_response.status_code, 200)
            self.assertEqual(plan_end_response.status_code, 200)

            deadline_data = deadline_response.json()
            plan_end_data = plan_end_response.json()

            # 5. 처리 결과 확인
            self.assertEqual(deadline_data["quotations"], 2)
            self.assertEqual(plan_end_data["plans"], 2)
