from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.security import jwt_auth
from typing import List
from asgiref.sync import sync_to_async
from subscription.models import Subscription, SubscriptionHistory, Payment
from subscription.schemas.inbound import (
    SubscriptionHistoryIn,
    BillingKeyIssueIn,
    SubscriptionPaymentIn,
    PaymentCancelIn,
)
from subscription.schemas.outbound import (
    SubscriptionOut,
    SubscriptionHistoryOut,
    BillingKeyIssueOut,
    PaymentResultOut,
    PaymentOut,
    PaymentCancelOut,
    SubscriptionStatusOut,
)
from factory.utils import get_factory_by_id, is_factory_member
from subscription.utils import (
    get_subscription_by_id,
    get_payment_by_id,
    get_subscription_history_by_id,
)
from subscription.services import TossPaymentsService, SubscriptionBillingService
from subscription.exceptions import PaymentError, BillingKeyError, SubscriptionError
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.db.models import F
import uuid
import logging
from subscription.barobill_utils import handle_barobill_scrap_for_subscription


logger = logging.getLogger(__name__)
router = Router(tags=["Subscription"])


@router.get(
    "",
    summary="[C] 플랜 목록 조회",
    description="플랜 목록을 조회합니다.",
    response=List[SubscriptionOut],
)
@paginate
async def get_subscriptions(request):
    subscriptions = await sync_to_async(list)(Subscription.objects.all())
    return subscriptions


@router.get(
    "/{factory_id}",
    summary="[C] 공장 구독 내역 조회",
    description="특정 공장의 구독 내역을 조회합니다.",
    response=List[SubscriptionHistoryOut],
    auth=jwt_auth,
)
@paginate
async def get_subscription_histories(request, factory_id: int):
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)

    histories = await sync_to_async(list)(
        SubscriptionHistory.objects.filter(factory=factory).select_related(
            "subscription", "factory"
        )
    )

    return histories


@router.post(
    "/{factory_id}",
    summary="[C] 구독 생성",
    description="특정 공장에 대한 구독을 생성합니다.",
    response={201: SubscriptionHistoryOut},
    auth=jwt_auth,
)
async def create_subscription_history(
    request, factory_id: int, payload: SubscriptionHistoryIn
):
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)
    subscription = await get_subscription_by_id(payload.subscription)

    # 이미 구독이 있는지 확인
    existing_history = await SubscriptionHistory.objects.filter(
        factory=factory,
        end_date__gt=timezone.now(),
    ).aexists()
    if existing_history:
        raise HttpError(
            status_code=400,
            message="이미 결제된 구독이 존재합니다.",
        )

    @sync_to_async
    @transaction.atomic
    def create_subscription():
        subscription_history = SubscriptionHistory.objects.create(
            factory=factory,
            subscription=subscription,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
        )
        return subscription_history

    subscription_history = await create_subscription()
    return 201, subscription_history


# ==================== 토스 페이먼츠 구독 결제 API ====================


@router.post(
    "/billing-key/{factory_id}",
    summary="[C] 빌링키 발급",
    description="토스페이먼츠 빌링키를 발급합니다.",
    response={201: BillingKeyIssueOut},
    auth=jwt_auth,
)
async def issue_billing_key(request, factory_id: int, payload: BillingKeyIssueIn):
    """빌링키 발급"""
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)

    toss_service = TossPaymentsService()
    customer_key = f"factory_{factory_id}_{user.id}_{uuid.uuid4().hex[:8]}"

    try:
        result = toss_service.issue_billing_key(
            customer_key=customer_key,
            card_number=payload.card_number,
            card_expiry_year=payload.card_expiry_year,
            card_expiry_month=payload.card_expiry_month,
            card_password=payload.card_password,
            customer_identity_number=payload.customer_identity_number,
        )

        billing_key_response = BillingKeyIssueOut(
            billing_key=result.get("billingKey"),
            customer_key=customer_key,
            card_company=result.get("card", {}).get("company"),
            card_type=result.get("card", {}).get("cardType"),
            card_number=result.get("card", {}).get("number"),
        )

        logger.info(
            f"빌링키 발급 성공: factory_id={factory_id}, billing_key={result.get('billingKey')}"
        )
        return 201, billing_key_response

    except Exception as e:
        logger.error(f"빌링키 발급 실패: factory_id={factory_id}, error={str(e)}")
        raise HttpError(400, f"빌링키 발급 실패: {str(e)}")


@router.post(
    "/payment/{factory_id}",
    summary="[C] 구독 결제",
    description="빌링키를 사용하여 구독 결제를 진행합니다.",
    response={200: PaymentResultOut},
    auth=jwt_auth,
)
async def process_subscription_payment(
    request, factory_id: int, payload: SubscriptionPaymentIn
):
    """구독 결제 진행"""
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)
    subscription = await get_subscription_by_id(payload.subscription_id)

    # 이미 활성 구독이 있는지 확인
    existing_history = await SubscriptionHistory.objects.filter(
        factory=factory,
        end_date__gt=timezone.now(),
    ).aexists()

    if existing_history:
        raise HttpError(400, "이미 활성화된 구독이 존재합니다.")

    toss_service = TossPaymentsService()
    order_id = f"subscription_{factory_id}_{int(timezone.now().timestamp())}"

    @sync_to_async
    @transaction.atomic
    def create_payment_and_history():
        # 구독 히스토리 생성
        subscription_history = SubscriptionHistory.objects.create(
            factory=factory,
            subscription=subscription,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
            billing_key=payload.billing_key,
            customer_key=payload.customer_key,
        )

        # 결제 객체 생성
        payment = Payment.objects.create(
            subscription_history=subscription_history,
            order_id=order_id,
            amount=subscription.price,
            status="PENDING",
        )

        return payment, subscription_history

    try:
        payment, subscription_history = await create_payment_and_history()

        # 토스페이먼츠 결제 요청
        payment_result = toss_service.request_billing_payment(
            billing_key=payload.billing_key,
            customer_key=payload.customer_key,
            amount=int(subscription.price),
            order_id=order_id,
            order_name=f"{subscription.type} 플랜 구독료",
        )

        @sync_to_async
        @transaction.atomic
        def update_payment_success():
            payment.payment_key = payment_result.get("paymentKey")
            payment.status = "DONE"
            payment.method = payment_result.get("method")
            payment.approved_at = timezone.now()

            # 카드 정보 저장
            card_info = payment_result.get("card", {})
            payment.card_company = card_info.get("company")
            payment.card_type = card_info.get("cardType")
            payment.card_number = card_info.get("number")
            payment.card_owner_type = card_info.get("ownerType")

            payment.save()
            return payment

        updated_payment = await update_payment_success()

        # basic, partners 구독에 대해 바로빌 홈택스 스크랩 등록
        try:
            await handle_barobill_scrap_for_subscription(
                factory, subscription.type, "activate"
            )
        except Exception as e:
            logger.error(
                f"바로빌 홈택스 스크랩 등록 실패: factory_id={factory_id}, error={str(e)}"
            )
            # 스크랩 등록 실패해도 결제는 성공으로 처리

        result = PaymentResultOut(
            # 구독 정보
            subscription_id=subscription.id,
            subscription_type=subscription.type,
            payment_key=payment_result.get("paymentKey"),
            order_id=order_id,
            amount=int(subscription.price),
            status="DONE",
            approved_at=updated_payment.approved_at,
            method=payment_result.get("method"),
            # 카드 정보
            card_company=payment_result.get("card", {}).get("company"),
            card_type=payment_result.get("card", {}).get("cardType"),
            card_number=payment_result.get("card", {}).get("number"),
            card_owner_type=payment_result.get("card", {}).get("ownerType"),
        )

        logger.info(
            f"구독 결제 성공: factory_id={factory_id}, payment_key={payment_result.get('paymentKey')}"
        )
        return 200, result

    except (PaymentError, BillingKeyError) as e:
        # 결제 실패시 payment 상태 업데이트
        @sync_to_async
        def update_payment_failed():
            payment.status = "FAILED"
            payment.failure_message = str(e)
            payment.save()

        await update_payment_failed()
        logger.error(f"구독 결제 실패: factory_id={factory_id}, error={str(e)}")
        raise HttpError(400, f"결제 실패: {str(e)}")
    except Exception as e:
        logger.error(f"구독 결제 오류: factory_id={factory_id}, error={str(e)}")
        raise HttpError(500, f"결제 처리 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/payments/{factory_id}",
    summary="[C] 결제 내역 조회",
    description="공장의 구독 결제 내역을 조회합니다.",
    response=List[PaymentOut],
    auth=jwt_auth,
)
@paginate
async def get_payment_history(request, factory_id: int):
    """결제 내역 조회"""
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)

    payments = await sync_to_async(list)(
        Payment.objects.filter(subscription_history__factory=factory)
        .select_related("subscription_history__subscription")
        .order_by("-created_at")
    )

    return payments


@router.get(
    "/status/{factory_id}",
    summary="[C] 구독 상태 조회",
    description="공장의 현재 구독 상태를 조회합니다.",
    response=SubscriptionStatusOut,
    auth=jwt_auth,
)
async def get_subscription_status(request, factory_id: int):
    """구독 상태 조회"""
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)

    # 현재 활성 구독 조회
    current_subscription = await sync_to_async(
        SubscriptionHistory.objects.filter(
            factory=factory, end_date__gt=timezone.now().date()
        )
        .select_related("subscription")
        .first
    )()

    if not current_subscription:
        raise HttpError(404, "활성화된 구독이 없습니다.")

    # 최신 결제 내역 조회
    latest_payment = await sync_to_async(
        Payment.objects.filter(subscription_history=current_subscription)
        .order_by("-created_at")
        .first
    )()

    is_active = current_subscription.end_date > timezone.now().date()

    result = SubscriptionStatusOut(
        subscription_history=SubscriptionHistoryOut.from_orm(current_subscription),
        current_payment=PaymentOut.from_orm(latest_payment) if latest_payment else None,
        next_billing_date=(
            current_subscription.end_date.isoformat() if is_active else None
        ),
        is_active=is_active,
    )

    return result


@router.post(
    "/cancel/{payment_id}",
    summary="[C] 결제 취소",
    description="구독 결제를 취소합니다.",
    response=PaymentCancelOut,
    auth=jwt_auth,
)
async def cancel_payment(request, payment_id: int, payload: PaymentCancelIn):
    """결제 취소"""
    user = request.auth
    payment = await get_payment_by_id(payment_id)

    # 권한 확인
    subscription_history = payment.subscription_history
    member = await is_factory_member(subscription_history.factory.id, user)

    if payment.status != "DONE":
        raise HttpError(400, "완료된 결제만 취소할 수 있습니다.")

    toss_service = TossPaymentsService()

    try:
        # 토스페이먼츠 결제 취소 API 호출
        cancel_result = toss_service.cancel_payment(
            payment_key=payment.payment_key,
            cancel_reason=payload.cancel_reason,
            cancel_amount=payload.cancel_amount or int(payment.amount),
        )

        @sync_to_async
        @transaction.atomic
        def update_payment_canceled():
            payment.status = "CANCELED"
            payment.save()

            # 구독 히스토리도 비활성화
            subscription_history.end_date = timezone.now().date()
            subscription_history.save()

        await update_payment_canceled()

        # basic, partners 구독 취소 시 바로빌 홈택스 스크랩 정지
        subscription = subscription_history.subscription
        factory = subscription_history.factory
        try:
            await handle_barobill_scrap_for_subscription(
                factory, subscription.type, "deactivate"
            )
        except Exception as e:
            logger.error(
                f"바로빌 홈택스 스크랩 정지 실패: factory_id={factory.id}, error={str(e)}"
            )
            # 스크랩 정지 실패해도 결제 취소는 성공으로 처리

        result = PaymentCancelOut(
            payment_key=payment.payment_key,
            cancel_amount=payload.cancel_amount or int(payment.amount),
            cancel_reason=payload.cancel_reason,
            canceled_at=timezone.now(),
        )

        logger.info(f"결제 취소 성공: payment_id={payment_id}")
        return result

    except Exception as e:
        logger.error(f"결제 취소 실패: payment_id={payment_id}, error={str(e)}")
        raise HttpError(400, f"결제 취소 실패: {str(e)}")


@router.post(
    "/renewal/{factory_id}",
    summary="[C] 구독 갱신",
    description="기존 빌링키를 사용하여 구독을 자동 갱신합니다.",
    response=PaymentResultOut,
    auth=jwt_auth,
)
async def renew_subscription(request, factory_id: int):
    """구독 갱신 (자동 결제)"""
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)

    # 현재 구독 조회
    current_subscription = await sync_to_async(
        SubscriptionHistory.objects.filter(
            factory=factory, end_date__gte=timezone.now().date()
        )
        .select_related("subscription")
        .first
    )()

    if not current_subscription:
        raise HttpError(404, "갱신할 구독이 없습니다.")

    if not current_subscription.billing_key:
        raise HttpError(400, "빌링키가 없습니다. 새로 결제를 진행해주세요.")

    billing_service = SubscriptionBillingService()

    try:
        payment = billing_service.process_subscription_payment(current_subscription)

        # basic, partners 구독 갱신 시 바로빌 홈택스 스크랩 상태 확인 및 등록
        subscription = current_subscription.subscription
        try:
            await handle_barobill_scrap_for_subscription(
                factory, subscription.type, "renew"
            )
        except Exception as e:
            logger.warning(
                f"바로빌 홈택스 스크랩 갱신 등록 실패: factory_id={factory_id}, error={str(e)}"
            )
            # 스크랩 등록 실패해도 구독 갱신은 성공으로 처리

        result = PaymentResultOut(
            subscription_id=subscription.id,
            subscription_type=subscription.type,
            payment_key=payment.payment_key,
            order_id=payment.order_id,
            amount=int(payment.amount),
            status=payment.status,
            approved_at=payment.approved_at,
            method=payment.method,
            # 카드 정보
            card_company=payment.card_company,
            card_type=payment.card_type,
            card_number=payment.card_number,
            card_owner_type=payment.card_owner_type,
        )

        logger.info(f"구독 갱신 성공: factory_id={factory_id}")
        return result

    except Exception as e:
        logger.error(f"구독 갱신 실패: factory_id={factory_id}, error={str(e)}")
        raise HttpError(400, f"구독 갱신 실패: {str(e)}")


@router.post(
    "/webhook/toss-payments",
    summary="토스페이먼츠 웹훅",
    description="토스페이먼츠에서 보내는 결제 상태 변경 웹훅을 처리합니다.",
    response={200: dict},
    auth=None,  # 웹훅은 인증 없이 처리
    include_in_schema=False,  # API 문서에서 제외
)
async def toss_payments_webhook(request):
    """토스페이먼츠 웹훅 처리"""
    import json

    try:
        # 요청 본문 파싱
        body = request.body.decode("utf-8")
        webhook_data = json.loads(body)

        event_type = webhook_data.get("eventType")
        payment_key = webhook_data.get("data", {}).get("paymentKey")

        if not payment_key:
            logger.warning("웹훅에서 payment_key를 찾을 수 없습니다.")
            return {"status": "error", "message": "payment_key required"}

        logger.info(
            f"토스페이먼츠 웹훅 수신: event_type={event_type}, payment_key={payment_key}"
        )

        @sync_to_async
        def update_payment_status():
            try:
                payment = Payment.objects.get(payment_key=payment_key)

                if event_type == "PAYMENT_STATUS_CHANGED":
                    # 결제 상태 변경 처리
                    new_status = webhook_data.get("data", {}).get("status")
                    old_status = payment.status

                    if new_status == "DONE":
                        payment.status = "DONE"
                        payment.approved_at = timezone.now()
                    elif new_status == "CANCELED":
                        payment.status = "CANCELED"
                    elif new_status == "FAILED":
                        payment.status = "FAILED"
                        payment.failure_code = (
                            webhook_data.get("data", {}).get("failure", {}).get("code")
                        )
                        payment.failure_message = (
                            webhook_data.get("data", {})
                            .get("failure", {})
                            .get("message")
                        )

                    payment.save()

                    # 상태 변경에 따른 바로빌 스크랩 처리는 별도 태스크로 처리
                    subscription_history = payment.subscription_history
                    factory = subscription_history.factory
                    subscription = subscription_history.subscription

                    # 결제 완료 -> 스크랩 활성화
                    if old_status != "DONE" and new_status == "DONE":
                        payment._webhook_scrap_action = (
                            "activate",
                            factory,
                            subscription.type,
                        )

                    # 결제 취소 -> 스크랩 비활성화
                    elif old_status == "DONE" and new_status == "CANCELED":
                        payment._webhook_scrap_action = (
                            "deactivate",
                            factory,
                            subscription.type,
                        )

                    return payment

            except Payment.DoesNotExist:
                logger.warning(
                    f"웹훅으로 전달된 payment_key에 해당하는 결제가 없습니다: {payment_key}"
                )
                return None

        payment = await update_payment_status()

        if payment:
            logger.info(
                f"웹훅 처리 완료: payment_key={payment_key}, status={payment.status}"
            )

            # 바로빌 스크랩 처리가 필요한 경우 별도 처리
            if hasattr(payment, "_webhook_scrap_action"):
                action, factory, subscription_type = payment._webhook_scrap_action
                try:
                    await handle_barobill_scrap_for_subscription(
                        factory, subscription_type, action
                    )
                    logger.info(
                        f"웹훅 바로빌 스크랩 {action} 처리 성공: payment_key={payment_key}"
                    )
                except Exception as e:
                    logger.error(
                        f"웹훅 바로빌 스크랩 {action} 처리 실패: payment_key={payment_key}, error={str(e)}"
                    )

        return {"status": "success"}

    except json.JSONDecodeError:
        logger.error("웹훅 데이터 파싱 실패")
        return {"status": "error", "message": "Invalid JSON"}
    except Exception as e:
        logger.error(f"웹훅 처리 중 오류 발생: {str(e)}")
        return {"status": "error", "message": str(e)}
