"""
웹소켓 관련 유틸리티 패키지

이 패키지는 웹소켓을 통한 실시간 알림 전송 기능을 제공합니다.

주요 기능:
- 단일 사용자에게 알림 전송
- 여러 사용자에게 일괄 알림 전송
- 공장의 모든 멤버에게 알림 전송
- 동기/비동기 알림 전송 지원

사용법:
    from websocket.utils import send_notification, send_notification_sync

    # 비동기 방식
    await send_notification(user_id=1, notification_type="warning",
                          notification_case="material_lack", content="자재 부족")

    # 동기 방식 (Django 뷰 등에서 사용)
    send_notification_sync(user_id=1, notification_type="warning",
                         notification_case="material_lack", content="자재 부족")
"""

from .utils import (
    send_notification,
    send_notification_to_multiple,
    send_notification_to_factory,
    send_notification_sync,
    NotificationSender,
)

__all__ = [
    "send_notification",
    "send_notification_to_multiple",
    "send_notification_to_factory",
    "send_notification_sync",
    "NotificationSender",
]
