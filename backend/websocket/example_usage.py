"""
웹소켓 알림 유틸 함수 사용 예시

이 파일은 websocket/utils.py의 알림 전송 함수들을 어떻게 사용하는지 보여줍니다.
"""

import asyncio
from .utils import (
    send_notification,
    send_notification_to_multiple,
    send_notification_to_factory,
    send_notification_sync,
)


async def example_single_notification():
    """단일 사용자에게 알림 전송 예시"""
    success = await send_notification(
        user_id=1,
        notification_type="warning",
        notification_case="material_lack",
        content="자재가 부족합니다. 빠른 보충이 필요합니다.",
        additional_data={"material_id": 123, "current_stock": 5, "required_stock": 100},
    )

    if success:
        print("알림이 성공적으로 전송되었습니다.")
    else:
        print("알림 전송에 실패했습니다.")


async def example_multiple_notifications():
    """여러 사용자에게 알림 전송 예시"""
    result = await send_notification_to_multiple(
        user_ids=[1, 2, 3, 4, 5],
        notification_type="information",
        notification_case="product_completed",
        content="제품 생산이 완료되었습니다.",
        additional_data={"product_id": 456, "completion_time": "2025-08-07 15:30:00"},
    )

    print(f"전송 결과: 성공 {result['success']}건, 실패 {result['failed']}건")
    if result["failed_users"]:
        print(f"실패한 사용자 ID: {result['failed_users']}")


async def example_factory_notification():
    """공장 전체에 알림 전송 예시"""
    result = await send_notification_to_factory(
        factory_id=1,
        notification_type="warning",
        notification_case="due_date_approaching",
        content="납기일이 3일 남았습니다. 생산 일정을 확인해주세요.",
        additional_data={
            "project_id": 789,
            "due_date": "2025-08-10",
            "remaining_days": 3,
        },
        exclude_user_ids=[1],  # 관리자는 제외
    )

    print(f"공장 알림 전송 결과: 성공 {result['success']}건, 실패 {result['failed']}건")


def example_sync_notification():
    """동기 함수에서 알림 전송 예시"""
    success = send_notification_sync(
        user_id=1,
        notification_type="completed",
        notification_case="sales_tax_invoice_published",
        content="매출 세금계산서 발행이 완료되었습니다.",
        additional_data={"invoice_id": "INV-2025-001", "amount": 1000000},
    )

    if success:
        print("동기 알림이 성공적으로 전송되었습니다.")
    else:
        print("동기 알림 전송에 실패했습니다.")


# Django 뷰에서 사용하는 예시
def django_view_example(request):
    """Django 뷰에서 알림 전송 예시"""
    from django.http import JsonResponse

    # 동기 방식으로 알림 전송
    success = send_notification_sync(
        user_id=request.user.id,
        notification_type="information",
        notification_case="permission_changed",
        content="권한이 변경되었습니다.",
    )

    return JsonResponse({"success": success})


# Celery 태스크에서 사용하는 예시
def celery_task_example():
    """Celery 태스크에서 알림 전송 예시"""
    # from celery import shared_task

    # @shared_task
    # def send_production_alert(factory_id, message):
    #     """생산 관련 알림을 전송하는 Celery 태스크"""
    #     result = asyncio.run(
    #         send_notification_to_factory(
    #             factory_id=factory_id,
    #             notification_type="warning",
    #             notification_case="production_schedule_changed",
    #             content=message
    #         )
    #     )
    #     return result
    pass


# Django Signals에서 사용하는 예시
def django_signal_example():
    """Django Signals에서 알림 전송 예시"""
    # from django.db.models.signals import post_save
    # from django.dispatch import receiver
    # from project.models import Project

    # @receiver(post_save, sender=Project)
    # def project_created_notification(sender, instance, created, **kwargs):
    #     """프로젝트 생성 시 알림 전송"""
    #     if created:
    #         send_notification_sync(
    #             user_id=instance.manager.user.id,
    #             notification_type="information",
    #             notification_case="project_warning",
    #             content=f"새로운 프로젝트 '{instance.name}'이 생성되었습니다."
    #         )
    pass


if __name__ == "__main__":
    # 비동기 함수 실행 예시
    asyncio.run(example_single_notification())
    asyncio.run(example_multiple_notifications())
    asyncio.run(example_factory_notification())

    # 동기 함수 실행 예시
    example_sync_notification()
