import json
import asyncio
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from notification.models import Notification
from factory.models import FactoryMember
from asgiref.sync import sync_to_async
from typing import Union, List, Optional
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationSender:
    """웹소켓을 통한 알림 전송 클래스"""

    def __init__(self):
        self.channel_layer = get_channel_layer()

    async def send_notification_to_user(
        self,
        user_id: int,
        notification_type: str,
        notification_case: str,
        content: str,
        additional_data: Optional[dict] = None,
    ) -> bool:
        """
        특정 사용자에게 알림을 전송합니다.

        Args:
            user_id: 수신자 ID
            notification_type: 알림 유형 (warning, information, completed)
            notification_case: 알림 사유
            content: 알림 내용
            additional_data: 추가 데이터

        Returns:
            bool: 전송 성공 여부
        """
        try:
            # Notification 모델에 저장
            notification = await self._save_notification(
                user_id, notification_type, notification_case, content
            )

            if not notification:
                logger.error(f"Failed to save notification for user {user_id}")
                return False

            # 웹소켓으로 실시간 전송
            await self._send_websocket_message(user_id, notification, additional_data)

            logger.info(f"Notification sent to user {user_id}: {content}")
            return True

        except Exception as e:
            logger.error(f"Error sending notification to user {user_id}: {str(e)}")
            return False

    async def send_notification_to_multiple_users(
        self,
        user_ids: List[int],
        notification_type: str,
        notification_case: str,
        content: str,
        additional_data: Optional[dict] = None,
    ) -> dict:
        """
        여러 사용자에게 알림을 전송합니다.

        Args:
            user_ids: 수신자 ID 리스트
            notification_type: 알림 유형
            notification_case: 알림 사유
            content: 알림 내용
            additional_data: 추가 데이터

        Returns:
            dict: 전송 결과 (성공/실패 개수)
        """
        results = {"success": 0, "failed": 0, "failed_users": []}

        tasks = []
        for user_id in user_ids:
            task = self.send_notification_to_user(
                user_id, notification_type, notification_case, content, additional_data
            )
            tasks.append((user_id, task))

        for user_id, task in tasks:
            try:
                success = await task
                if success:
                    results["success"] += 1
                else:
                    results["failed"] += 1
                    results["failed_users"].append(user_id)
            except Exception as e:
                logger.error(
                    f"Error in batch notification for user {user_id}: {str(e)}"
                )
                results["failed"] += 1
                results["failed_users"].append(user_id)

        return results

    async def send_notification_to_factory_members(
        self,
        factory_id: int,
        notification_type: str,
        notification_case: str,
        content: str,
        additional_data: Optional[dict] = None,
        exclude_user_ids: Optional[List[int]] = None,
    ) -> dict:
        """
        특정 공장의 모든 멤버에게 알림을 전송합니다.

        Args:
            factory_id: 공장 ID
            notification_type: 알림 유형
            notification_case: 알림 사유
            content: 알림 내용
            additional_data: 추가 데이터
            exclude_user_ids: 제외할 사용자 ID 리스트

        Returns:
            dict: 전송 결과
        """
        try:
            # 공장 멤버들의 user_id 가져오기
            member_ids = await self._get_factory_member_ids(
                factory_id, exclude_user_ids
            )

            if not member_ids:
                logger.warning(f"No members found for factory {factory_id}")
                return {"success": 0, "failed": 0, "failed_users": []}

            # 일괄 전송
            return await self.send_notification_to_multiple_users(
                member_ids,
                notification_type,
                notification_case,
                content,
                additional_data,
            )

        except Exception as e:
            logger.error(
                f"Error sending notification to factory {factory_id}: {str(e)}"
            )
            return {"success": 0, "failed": 1, "failed_users": []}

    @sync_to_async
    def _save_notification(
        self, user_id: int, notification_type: str, notification_case: str, content: str
    ) -> Optional[Notification]:
        """알림을 데이터베이스에 저장합니다."""
        try:
            factory_member = FactoryMember.objects.get(user_id=user_id)
            notification = Notification.objects.create(
                receiver=factory_member,
                type=notification_type,
                case=notification_case,
                content=content,
            )
            return notification
        except FactoryMember.DoesNotExist:
            logger.error(f"FactoryMember not found for user {user_id}")
            return None
        except Exception as e:
            logger.error(f"Error saving notification: {str(e)}")
            return None

    async def _send_websocket_message(
        self,
        user_id: int,
        notification: Notification,
        additional_data: Optional[dict] = None,
    ):
        """웹소켓으로 메시지를 전송합니다."""
        if not self.channel_layer:
            logger.warning("Channel layer not configured")
            return

        # 그룹 이름 생성
        group_name = f"notification_{user_id}"

        # 전송할 메시지 구성
        message_data = {
            "type": "notification_message",
            "notification": {
                "id": notification.id,
                "type": notification.type,
                "case": notification.case,
                "content": notification.content,
                "is_read": notification.is_read,
                "created_at": notification.created_at.isoformat(),
            },
        }

        # 추가 데이터 포함
        if additional_data:
            message_data["additional_data"] = additional_data

        try:
            await self.channel_layer.group_send(group_name, message_data)
        except Exception as e:
            logger.error(
                f"Error sending websocket message to group {group_name}: {str(e)}"
            )

    @sync_to_async
    def _get_factory_member_ids(
        self, factory_id: int, exclude_user_ids: Optional[List[int]] = None
    ) -> List[int]:
        """공장 멤버들의 user_id 리스트를 가져옵니다."""
        try:
            queryset = FactoryMember.objects.filter(factory_id=factory_id)

            if exclude_user_ids:
                queryset = queryset.exclude(user_id__in=exclude_user_ids)

            return list(queryset.values_list("user_id", flat=True))
        except Exception as e:
            logger.error(f"Error getting factory member IDs: {str(e)}")
            return []


# 편의 함수들
notification_sender = NotificationSender()


async def send_notification(
    user_id: int,
    notification_type: str,
    notification_case: str,
    content: str,
    additional_data: Optional[dict] = None,
) -> bool:
    """
    단일 사용자에게 알림을 전송합니다.

    사용 예시:
    await send_notification(
        user_id=1,
        notification_type="warning",
        notification_case="material_lack",
        content="자재가 부족합니다.",
        additional_data={"material_id": 123}
    )
    """
    return await notification_sender.send_notification_to_user(
        user_id, notification_type, notification_case, content, additional_data
    )


async def send_notification_to_multiple(
    user_ids: List[int],
    notification_type: str,
    notification_case: str,
    content: str,
    additional_data: Optional[dict] = None,
) -> dict:
    """
    여러 사용자에게 알림을 전송합니다.

    사용 예시:
    result = await send_notification_to_multiple(
        user_ids=[1, 2, 3],
        notification_type="information",
        notification_case="product_completed",
        content="제품 생산이 완료되었습니다."
    )
    """
    return await notification_sender.send_notification_to_multiple_users(
        user_ids, notification_type, notification_case, content, additional_data
    )


async def send_notification_to_factory(
    factory_id: int,
    notification_type: str,
    notification_case: str,
    content: str,
    additional_data: Optional[dict] = None,
    exclude_user_ids: Optional[List[int]] = None,
) -> dict:
    """
    공장의 모든 멤버에게 알림을 전송합니다.

    사용 예시:
    result = await send_notification_to_factory(
        factory_id=1,
        notification_type="warning",
        notification_case="due_date_approaching",
        content="납기일이 3일 남았습니다.",
        exclude_user_ids=[1]  # 특정 사용자 제외
    )
    """
    return await notification_sender.send_notification_to_factory_members(
        factory_id,
        notification_type,
        notification_case,
        content,
        additional_data,
        exclude_user_ids,
    )


def send_notification_sync(
    user_id: int,
    notification_type: str,
    notification_case: str,
    content: str,
    additional_data: Optional[dict] = None,
) -> bool:
    """
    동기적으로 알림을 전송합니다. (동기 함수에서 사용)

    사용 예시:
    success = send_notification_sync(
        user_id=1,
        notification_type="warning",
        notification_case="material_lack",
        content="자재가 부족습니다."
    )
    """
    import threading

    try:
        # 현재 실행 중인 이벤트 루프 확인
        try:
            current_loop = asyncio.get_running_loop()
            # 이미 실행 중인 루프가 있으면 새 스레드에서 실행
            result = None
            exception = None

            def run_in_thread():
                nonlocal result, exception
                try:
                    new_loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(new_loop)
                    result = new_loop.run_until_complete(
                        send_notification(
                            user_id,
                            notification_type,
                            notification_case,
                            content,
                            additional_data,
                        )
                    )
                except Exception as e:
                    exception = e
                finally:
                    new_loop.close()
                    asyncio.set_event_loop(None)

            thread = threading.Thread(target=run_in_thread)
            thread.start()
            thread.join()

            if exception:
                raise exception
            return result

        except RuntimeError:
            # 실행 중인 루프가 없음 - 새 루프 생성
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(
                    send_notification(
                        user_id,
                        notification_type,
                        notification_case,
                        content,
                        additional_data,
                    )
                )
            finally:
                loop.close()
                asyncio.set_event_loop(None)

    except Exception as e:
        logger.error(f"Error in sync notification: {str(e)}")
        return False
