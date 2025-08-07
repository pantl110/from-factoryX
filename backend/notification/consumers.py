from channels.generic.websocket import AsyncWebsocketConsumer
import json
from channels.db import database_sync_to_async
from .models import Notification


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.user_id = int(self.scope["url_route"]["kwargs"]["user_id"])
        self.notification_group_name = None

        # 권한 체크
        if not self.user or self.user.id != self.user_id:
            await self.close()
            return

        # 그룹 이름 설정
        self.notification_group_name = f"notification_{self.user_id}"

        # 그룹에 추가
        await self.channel_layer.group_add(
            self.notification_group_name, self.channel_name
        )

        await self.accept()

        await self.channel_layer.group_send(
            self.notification_group_name,
            {"type": "user_notification_connected", "user_id": str(self.user.id)},
        )

    async def disconnect(self, close_code):
        if hasattr(self, "notification_group_name") and self.notification_group_name:
            try:
                await self.channel_layer.group_discard(
                    self.notification_group_name, self.channel_name
                )
            except Exception:
                pass  # 연결 종료 시 오류는 무시

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "mark_as_read":
                notification_id = data["notification_id"]
                success = await self.mark_notification_as_read(notification_id)
                if success:
                    # 읽음 처리 성공 시 has_unread 상태도 함께 전송
                    has_unread = await self.check_has_unread()
                    await self.channel_layer.group_send(
                        self.notification_group_name,
                        {
                            "type": "notification_marked_as_read",
                            "notification_id": notification_id,
                            "has_unread": has_unread,
                        },
                    )
            elif message_type == "mark_all_read":
                await self.mark_all_notifications_as_read()
                await self.channel_layer.group_send(
                    self.notification_group_name,
                    {"type": "all_notifications_marked_as_read", "has_unread": False},
                )
        except Exception as e:
            await self.send_error(str(e))

    @database_sync_to_async
    def check_has_unread(self):
        return Notification.objects.filter(
            receiver_id=self.user_id, is_read=False
        ).exists()

    async def send_unread_notifications(self):
        try:
            notifications = await self.get_unread_notifications()
            has_unread = await self.check_has_unread()

            if notifications:
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "unread_notifications",
                            "notifications": notifications,
                            "has_unread": has_unread,
                        }
                    )
                )
        except Exception as e:
            print(f"Error sending notifications: {str(e)}")  # 디버깅용
            await self.send_error(f"Failed to send notifications: {str(e)}")

    @database_sync_to_async
    def get_unread_notifications(self):
        return list(
            Notification.objects.filter(receiver_id=self.user_id, is_read=False)
            .select_related("receiver")
            .values(
                "id",
                "content",
                "type",
                "case",
                "created_at",
                "receiver__name",
            )
            .order_by("-created_at")
        )

    async def send_notification(self, event):
        """
        새로운 알림이 생성되었을 때 클라이언트에게 전송
        """
        notification = event["notification"]
        await self.send(
            text_data=json.dumps(
                {
                    "type": "new_notification",
                    "notification": notification,
                    "has_unread": True,
                }
            )
        )

    async def notification_marked_as_read(self, event):
        """
        알림이 읽음 처리되었을 때
        """
        await self.send(
            text_data=json.dumps(
                {
                    "type": "notification_marked_as_read",
                    "notification_id": event["notification_id"],
                    "has_unread": event.get("has_unread", False),
                }
            )
        )

    async def all_notifications_marked_as_read(self, event):
        """
        모든 알림이 읽음 처리되었을 때
        """
        await self.send(
            text_data=json.dumps(
                {
                    "type": "all_notifications_marked_as_read",
                    "has_unread": event.get("has_unread", False),
                }
            )
        )

    async def notification_message(self, event):
        """
        웹소켓 유틸에서 전송된 새로운 알림 메시지 처리
        """
        notification = event["notification"]
        message_data = {
            "type": "new_notification",
            "notification": notification,
            "has_unread": True,
        }

        # 추가 데이터가 있으면 포함
        if "additional_data" in event:
            message_data["additional_data"] = event["additional_data"]

        await self.send(text_data=json.dumps(message_data))

    async def user_notification_connected(self, event):
        """
        사용자가 알림 웹소켓에 연결되었을 때
        """
        await self.send(
            text_data=json.dumps(
                {"type": "user_connected", "user_id": event["user_id"]}
            )
        )

    async def user_notification_disconnected(self, event):
        """
        사용자가 알림 웹소켓 연결을 끊었을 때
        """
        await self.send(
            text_data=json.dumps(
                {"type": "user_disconnected", "user_id": event["user_id"]}
            )
        )

    async def error_occurred(self, event):
        """
        에러가 발생했을 때
        """
        await self.send(
            text_data=json.dumps({"type": "error", "message": event["message"]})
        )

    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id, receiver_id=self.user_id
            )
            notification.is_read = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_all_notifications_as_read(self):
        Notification.objects.filter(receiver_id=self.user_id, is_read=False).update(
            is_read=True
        )

    async def send_error(self, message):
        await self.send(text_data=json.dumps({"type": "error", "message": message}))
