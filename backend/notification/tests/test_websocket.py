"""
웹소켓 알림 기본 기능 테스트

이 파일은 가장 기본적인 기능만 테스트합니다.
복잡한 이벤트 루프나 데이터베이스 락 문제를 피합니다.
"""

import json
from django.test import TransactionTestCase, override_settings
from django.contrib.auth import get_user_model
from unittest.mock import AsyncMock, patch

from factory.models import Factory, FactoryMember
from notification.models import Notification
from websocket.utils import NotificationSender

User = get_user_model()

# 테스트용 메모리 채널 레이어 설정
TEST_CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}


@override_settings(CHANNEL_LAYERS=TEST_CHANNEL_LAYERS)
class BasicWebSocketTestCase(TransactionTestCase):
    """기본 웹소켓 기능 테스트"""

    def setUp(self):
        """테스트 데이터 설정"""
        self.user1 = User.objects.create_user(
            username="testuser1", email="test1@example.com", password="password123!"
        )

        self.factory = Factory.objects.create(
            owner=self.user1,
            name="Test Factory",
            business_registration_number="123-45-67890",
        )

        self.member1 = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user1,
            role="admin",
            status="active",
            invited_by=self.user1,
        )

    def test_notification_sender_initialization(self):
        """NotificationSender 초기화 테스트"""
        sender = NotificationSender()
        self.assertIsNotNone(sender.channel_layer)

    def test_notification_creation_direct(self):
        """알림 직접 생성 테스트"""
        notification = Notification.objects.create(
            receiver=self.member1,
            type="warning",
            case="material_lack",
            content="직접 생성된 테스트 알림",
        )

        self.assertEqual(notification.receiver, self.member1)
        self.assertEqual(notification.type, "warning")
        self.assertEqual(notification.case, "material_lack")
        self.assertEqual(notification.content, "직접 생성된 테스트 알림")
        self.assertFalse(notification.is_read)

    def test_notification_save_method_only(self):
        """알림 저장 메서드만 테스트 (웹소켓 없이)"""
        with patch("websocket.utils.get_channel_layer") as mock_channel_layer:
            mock_layer = AsyncMock()
            mock_channel_layer.return_value = mock_layer

            sender = NotificationSender()
            sender.channel_layer = mock_layer

            # 동기적으로 저장 메서드만 테스트
            from asgiref.sync import sync_to_async
            import asyncio

            async def test_save():
                notification = await sender._save_notification(
                    user_id=self.user1.id,
                    factory_id=self.factory.id,
                    notification_type="information",
                    notification_case="product_completed",
                    content="저장 테스트",
                )
                return notification

            # 새 이벤트 루프에서 실행
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                notification = loop.run_until_complete(test_save())
                self.assertIsNotNone(notification)
                self.assertEqual(notification.content, "저장 테스트")
            finally:
                loop.close()

    def test_notification_is_saved_when_realtime_delivery_fails(self):
        """실시간 전송 실패가 알림 DB 저장을 되돌리지 않는지 확인"""
        sender = NotificationSender()
        sender.channel_layer = AsyncMock()
        sender.channel_layer.group_send.side_effect = ConnectionError(
            "Redis unavailable"
        )

        import asyncio

        async def send_notification():
            return await sender.send_notification_to_user(
                user_id=self.user1.id,
                factory_id=self.factory.id,
                notification_type="warning",
                notification_case="material_lack",
                content="실시간 전송 실패 테스트",
            )

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(send_notification())
        finally:
            loop.close()

        self.assertTrue(result)
        self.assertTrue(
            Notification.objects.filter(
                receiver=self.member1,
                content="실시간 전송 실패 테스트",
            ).exists()
        )
        sender.channel_layer.group_send.assert_awaited_once()

    def test_factory_member_exists(self):
        """공장 멤버가 존재하는지 테스트"""
        member = FactoryMember.objects.filter(user=self.user1).first()
        self.assertIsNotNone(member)
        self.assertEqual(member.factory, self.factory)
        self.assertEqual(member.user, self.user1)

    def test_notification_model_validation(self):
        """알림 모델 유효성 검사"""
        # 유효한 알림 생성
        notification = Notification(
            receiver=self.member1,
            type="warning",
            case="material_lack",
            content="유효성 테스트",
        )

        # 저장 전 유효성 검사
        try:
            notification.full_clean()  # 모델 유효성 검사
            notification.save()
            saved_notification = Notification.objects.get(id=notification.id)
            self.assertEqual(saved_notification.content, "유효성 테스트")
        except Exception as e:
            self.fail(f"Valid notification failed validation: {e}")

    def test_notification_types_choices(self):
        """알림 타입 선택지 테스트"""
        # 모든 유효한 타입 테스트
        valid_types = ["warning", "information", "completed"]

        for notification_type in valid_types:
            with self.subTest(type=notification_type):
                notification = Notification.objects.create(
                    receiver=self.member1,
                    type=notification_type,
                    content=f"{notification_type} 테스트",
                )
                self.assertEqual(notification.type, notification_type)

    def test_notification_cases_choices(self):
        """알림 사유 선택지 테스트"""
        valid_cases = [
            "material_lack",
            "product_completed",
            "sales_tax_invoice_published",
        ]

        for case in valid_cases:
            with self.subTest(case=case):
                notification = Notification.objects.create(
                    receiver=self.member1, case=case, content=f"{case} 테스트"
                )
                self.assertEqual(notification.case, case)

    def test_mock_websocket_message_format(self):
        """모킹된 웹소켓 메시지 형식 테스트"""
        with patch("websocket.utils.get_channel_layer") as mock_channel_layer:
            mock_layer = AsyncMock()
            mock_channel_layer.return_value = mock_layer

            sender = NotificationSender()
            sender.channel_layer = mock_layer

            # 메시지 형식 테스트를 위한 모킹
            notification = Notification.objects.create(
                receiver=self.member1,
                type="warning",
                case="material_lack",
                content="메시지 형식 테스트",
            )

            # _send_websocket_message 메서드 직접 테스트
            import asyncio

            async def test_message():
                await sender._send_websocket_message(
                    factory_id=self.factory.id,
                    notification=notification,
                    additional_data={"test": "data"},
                )

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(test_message())

                # 호출 확인
                mock_layer.group_send.assert_called_once()

                # 호출된 인자 확인
                call_args = mock_layer.group_send.call_args
                group_name = call_args[0][0]
                message_data = call_args[0][1]

                self.assertEqual(group_name, f"notification_{self.user1.id}")
                self.assertEqual(message_data["type"], "notification_message")
                self.assertIn("notification", message_data)
                self.assertIn("additional_data", message_data)

            finally:
                loop.close()

    def test_notification_read_status_change(self):
        """알림 읽음 상태 변경 테스트"""
        notification = Notification.objects.create(
            receiver=self.member1, content="읽음 상태 테스트"
        )

        # 초기 상태는 읽지 않음
        self.assertFalse(notification.is_read)

        # 읽음 처리
        notification.is_read = True
        notification.save()

        # DB에서 다시 조회하여 확인
        updated_notification = Notification.objects.get(id=notification.id)
        self.assertTrue(updated_notification.is_read)

    def test_multiple_notifications_for_user(self):
        """한 사용자에 대한 여러 알림 테스트"""
        # 3개의 알림 생성
        for i in range(3):
            Notification.objects.create(receiver=self.member1, content=f"알림 {i+1}")

        # 사용자의 모든 알림 확인
        notifications = Notification.objects.filter(receiver=self.member1)
        self.assertEqual(notifications.count(), 3)

        # 내용 확인
        contents = [n.content for n in notifications]
        self.assertIn("알림 1", contents)
        self.assertIn("알림 2", contents)
        self.assertIn("알림 3", contents)
