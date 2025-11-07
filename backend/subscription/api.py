from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.security import jwt_auth
from typing import List
from asgiref.sync import sync_to_async
from subscription.models import Subscription, SubscriptionHistory, Payment, PaymentAuth
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
    BillingKeyDeleteOut,
    PaymentResultOut,
    PaymentOut,
    PaymentCancelOut,
    SubscriptionStatusOut,
    PaymentAuthOut,
)
from factory.utils import get_factory_by_id, is_factory_member
from subscription.utils import (
    get_subscription_by_id,
    get_payment_by_id,
    get_subscription_history_by_id,
    resolve_card_company_from_issuer,
    change_subscription_plan,
)
from subscription.services import TossPaymentsService, SubscriptionBillingService
from subscription.exceptions import PaymentError, BillingKeyError
from django.utils import timezone
from datetime import timedelta
from dateutil.relativedelta import relativedelta
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

    @sync_to_async
    @transaction.atomic
    def create_subscription():
        current_date = timezone.now().date()
        
        # 현재 활성 구독 조회
        existing_subscription = SubscriptionHistory.objects.filter(
            factory=factory,
            end_date__gt=current_date,
        ).select_related('subscription').first()
        
        # 새로 생성할 구독 타입
        new_subscription_type = subscription.type
        
        if existing_subscription:
            existing_type = existing_subscription.subscription.type
            
            # Case 1: 트라이얼 → 유료 플랜 (즉시 시작)
            if existing_type == 'trial' and new_subscription_type in ['basic', 'partners']:
                # 트라이얼 즉시 종료
                existing_subscription.end_date = current_date
                existing_subscription.save()
                
                # 유료 플랜 즉시 시작
                start_date = current_date
                
            # Case 2: 유료 플랜 → 다른 유료 플랜 (기존 구독 종료 후 시작)
            elif existing_type in ['basic', 'partners'] and new_subscription_type in ['basic', 'partners']:
                # 기존 구독 종료일 다음 날부터 시작
                start_date = existing_subscription.end_date + timedelta(days=1)
                
            # Case 3: 같은 타입 또는 유료 → 트라이얼 (불가)
            elif existing_type in ['basic', 'partners'] and new_subscription_type == 'trial':
                raise ValueError("유료 구독 중에는 트라이얼로 변경할 수 없습니다.")
            elif existing_type == new_subscription_type:
                raise ValueError("이미 동일한 구독이 존재합니다.")
            else:
                raise ValueError("허용되지 않은 구독 변경입니다.")
        else:
            # 활성 구독이 없으면 즉시 시작
            start_date = current_date
        
        # 종료일 계산 (1개월)
        end_date = start_date + relativedelta(months=1)
        
        # 새 구독 생성
        subscription_history = SubscriptionHistory.objects.create(
            factory=factory,
            subscription=subscription,
            start_date=start_date,
            end_date=end_date,
            is_canceled=False,
        )
        return subscription_history

    subscription_history = await create_subscription()
    return 201, subscription_history


# ==================== 토스 페이먼츠 구독 결제 API ====================


@router.get(
    "/payment-auth/{factory_id}",
    summary="[C] 결제 인증 정보 조회",
    description="팩토리의 가장 최근에 등록된 결제 인증 정보 1건을 조회합니다.",
    response=PaymentAuthOut,
    auth=jwt_auth,
)
async def get_payment_auth(request, factory_id: int):
    """결제 인증 정보 단건 조회 (가장 최근 등록)"""
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)

    @sync_to_async
    def fetch_latest_payment_auth():
        try:
            return PaymentAuth.objects.get(factory=factory)
        except PaymentAuth.DoesNotExist:
            return None

    latest_payment_auth = await fetch_latest_payment_auth()
    if not latest_payment_auth:
        raise HttpError(404, "등록된 결제 정보가 없습니다.")

    setattr(latest_payment_auth, "is_current", True)
    return latest_payment_auth


# @router.post(
#     "/billing-key/{factory_id}",
#     summary="[C] 빌링키 발급",
#     description="토스페이먼츠 빌링키를 발급합니다.",
#     response={201: BillingKeyIssueOut},
#     auth=jwt_auth,
# )
# async def issue_billing_key(request, factory_id: int, payload: BillingKeyIssueIn):
#     """빌링키 발급"""
#     user = request.auth
#     factory = await get_factory_by_id(factory_id)
#     member = await is_factory_member(factory_id, user)

#     toss_service = TossPaymentsService()
#     customer_key = f"factory_{factory_id}_{user.id}_{uuid.uuid4().hex[:8]}"

#     try:
#         result = toss_service.issue_billing_key(
#             customer_key=customer_key,
#             card_number=payload.card_number,
#             card_expiry_year=payload.card_expiry_year,
#             card_expiry_month=payload.card_expiry_month,
#             card_password=payload.card_password,
#             customer_identity_number=payload.customer_identity_number,
#         )

#         billing_key_response = BillingKeyIssueOut(
#             billing_key=result.get("billingKey"),
#             customer_key=customer_key,
#             card_company=result.get("card", {}).get("company"),
#             card_type=result.get("card", {}).get("cardType"),
#             card_number=result.get("card", {}).get("number"),
#         )

#         logger.info(
#             f"빌링키 발급 성공: factory_id={factory_id}, billing_key={result.get('billingKey')}"
#         )

#         # PaymentAuth 모델에 저장
#         await PaymentAuth.objects.aget_or_create(
#             factory=factory,
#             defaults={
#                 "auth_key": result.get("authKey", ""),
#                 "billing_key": result.get("billingKey"),
#                 "customer_key": customer_key,
#             },
#         )

#         return 201, billing_key_response

#     except Exception as e:
#         logger.error(f"빌링키 발급 실패: factory_id={factory_id}, error={str(e)}")
#         raise HttpError(400, f"빌링키 발급 실패: {str(e)}")

@router.post(
    "/billing-key/{factory_id}",
    summary="[C] 빌링키 발급",
    description="토스 위젯 성공 콜백(authKey, customerKey)으로 빌링키를 발급합니다.",
    response={201: BillingKeyIssueOut},
    auth=jwt_auth,
)
async def issue_billing_key(request, factory_id: int, payload: BillingKeyIssueIn):
    """빌링키 발급"""
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)

    toss_service = TossPaymentsService()

    try:
        result = toss_service.issue_billing_key(
            auth_key=payload.auth_key,
            customer_key=payload.customer_key,
        )

        # issuerCode 기준으로 저장/응답
        card_info = result.get("card", {}) if isinstance(result, dict) else {}
        issuer_code = str(
            (card_info.get("issuerCode") if isinstance(card_info, dict) else None)
            or result.get("issuerCode")
            or "UNKNOWN"
        )
        resolved_company = (
            resolve_card_company_from_issuer(issuer_code)
            or result.get("cardCompany")
            or issuer_code
        )

        billing_key_response = BillingKeyIssueOut(
            billing_key=result.get("billingKey"),
            customer_key=payload.customer_key,
            card_company=resolved_company,
            card_number=result.get("cardNumber"),
        )

        logger.info(
            f"빌링키 발급 성공: factory_id={factory_id}, billing_key={result.get('billingKey')}"
        )

        # PaymentAuth: 공장당 1건만 유지 (기존 삭제 후 최신으로 교체)
        @sync_to_async
        @transaction.atomic
        def replace_payment_auth():
            PaymentAuth.objects.filter(factory=factory).delete()
            payment_auth = PaymentAuth.objects.create(
                factory=factory,
                customer_key=payload.customer_key,
                billing_key=result.get("billingKey"),
                card_company=resolved_company,
                card_number=result.get("cardNumber"),
            )
            # 팩토리에도 빌링키 저장
            factory.billing_key = result.get("billingKey")
            factory.save(update_fields=["billing_key"]) 
            return payment_auth

        await replace_payment_auth()

        return 201, billing_key_response

    except Exception as e:
        logger.error(f"빌링키 발급 실패: factory_id={factory_id}, error={str(e)}")
        raise HttpError(400, f"{str(e)}")


@router.delete(
    "/billing-key/{factory_id}",
    summary="[C] 빌링키 삭제",
    description="등록된 카드(빌링키)를 삭제합니다.",
    response=BillingKeyDeleteOut,
    auth=jwt_auth,
)
async def delete_billing_key(request, factory_id: int):
    """빌링키 삭제"""
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)

    # PaymentAuth 또는 Factory에 저장된 빌링키 기준으로 판단 (하나만 있어도 삭제 진행)
    payment_auth = await sync_to_async(
        lambda: PaymentAuth.objects.filter(factory=factory).first()
    )()

    billing_key_to_delete = payment_auth.billing_key if payment_auth else factory.billing_key
    customer_key_to_use = payment_auth.customer_key if payment_auth else None

    if not billing_key_to_delete and not customer_key_to_use:
        # 둘 다 전혀 없으면 삭제할 것이 없음
        raise HttpError(404, "삭제할 빌링키가 없습니다.")

    toss_service = TossPaymentsService()

    try:
        ## 토스페이먼츠 빌링키 삭제 API 호출: billing_key와 customer_key가 모두 있을 때만 시도
        if billing_key_to_delete and customer_key_to_use:
            try:
                toss_service.delete_billing_key(
                    billing_key=billing_key_to_delete,
                    customer_key=customer_key_to_use,
                )
            except Exception as e:
                # 외부 삭제 실패해도 로컬 정리는 진행 (요청 사항: 강하게 정리)
                logger.warning(
                    f"토스 빌링키 삭제 실패, 로컬 정리 계속: factory_id={factory_id}, error={str(e)}"
                )

        @sync_to_async
        @transaction.atomic
        def clear_keys():
            # PaymentAuth 삭제 (공장 기준)
            PaymentAuth.objects.filter(factory=factory).delete()

            # 팩토리의 빌링키 초기화
            factory.billing_key = None
            factory.save(update_fields=["billing_key"]) 

            # 현재 및 미래(플랜 변경 예정 시 다음 구독 플랜) 구독 이력의 키 정보 초기화 (end_date >= today)
            from django.utils import timezone as dj_tz
            for hist in SubscriptionHistory.objects.filter(
                factory=factory,
                end_date__gte=dj_tz.now().date(),
            ):
                hist.billing_key = None
                hist.customer_key = None
                hist.auth_key = None
                hist.save()

        await clear_keys()

        logger.info(f"빌링키 삭제 성공: factory_id={factory_id}")
        return BillingKeyDeleteOut(
            success=True, message="등록된 카드가 성공적으로 삭제되었습니다."
        )

    except Exception as e:
        logger.error(f"빌링키 삭제 실패: factory_id={factory_id}, error={str(e)}")
        raise HttpError(400, f"카드 삭제 실패: {str(e)}")


@router.post(
    "/payment/{factory_id}",
    summary="[C] 구독 결제",
    description="빌링키를 사용하여 구독 결제를 진행합니다. 구독 취소 해지시에는 결제는 하지 않고 기존 구독 이력을 재활성화합니다.",
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

    # 1️⃣ 취소된 동일 플랜 재활성화 확인
    @sync_to_async
    def find_canceled_same_plan():
        return (
            SubscriptionHistory.objects.filter(
                factory=factory,
                subscription=subscription,
                is_canceled=True,
                end_date__gt=timezone.now().date(),
            )
            .order_by("-end_date")
            .first()
        )

    canceled_same_plan = await find_canceled_same_plan()
    if canceled_same_plan:
        @sync_to_async
        @transaction.atomic
        def reactivate_history():
            canceled_same_plan.is_canceled = False
            canceled_same_plan.billing_key = payload.billing_key
            canceled_same_plan.customer_key = payload.customer_key
            canceled_same_plan.save(
                update_fields=["is_canceled", "billing_key", "customer_key"]
            )
            return canceled_same_plan

        reactivated = await reactivate_history()

        # 결제 없이 재활성화 응답 구성
        result = PaymentResultOut(
            subscription_id=subscription.id,
            subscription_type=subscription.type,
            payment_key="",
            order_id=f"reactivated_{reactivated.id}_{int(timezone.now().timestamp())}",
            amount=0,
            status="DONE",
            approved_at=timezone.now(),
            method="REACTIVATED",
            card_company=None,
            card_type=None,
            card_number=None,
            card_owner_type=None,
        )

        # basic, partners 구독 재활성화 시 바로빌 홈택스 스크랩 재활성화
        try:
            await handle_barobill_scrap_for_subscription(
                factory, subscription.type, "activate"
            )
        except Exception as e:
            logger.warning(
                f"바로빌 홈택스 스크랩 재활성화 실패: factory_id={factory_id}, error={str(e)}"
            )
        logger.info(
            f"구독 취소 해지 재활성화 처리: factory_id={factory_id}, history_id={reactivated.id}"
        )
        return 200, result

    # 2️⃣ 활성 구독 확인 (취소된 구독도 포함)
    existing_history = await SubscriptionHistory.objects.filter(
        factory=factory,
        end_date__gt=timezone.now(),
    ).select_related('subscription').afirst()

    if existing_history:
        # 같은 플랜이면 에러 반환
        if existing_history.subscription_id == payload.subscription_id:
            raise HttpError(400, "이미 동일한 구독 플랜이 활성화되어 있습니다.")
        
        existing_type = existing_history.subscription.type
        new_subscription_type = subscription.type
        
        # Case 1: 트라이얼 → 유료 플랜 (즉시 시작)
        if existing_type == 'trial' and new_subscription_type in ['basic', 'partners']:
            # 트라이얼 즉시 종료하고 유료 플랜 즉시 시작하며 결제 진행
            current_date = timezone.now().date()
            
            @sync_to_async
            @transaction.atomic
            def terminate_trial_and_start_paid():
                # 트라이얼 즉시 종료
                existing_history.end_date = current_date
                existing_history.save()
                return current_date
            
            await terminate_trial_and_start_paid()
            
            # 결제 진행 (아래 3️⃣ 로직으로 진행)
            # existing_history가 없어진 것처럼 처리하기 위해 None으로 설정
            existing_history = None
        else:
            # Case 2: 유료 플랜 → 다른 유료 플랜
            # 다른 플랜이면 다음 구독을 미리 생성(플랜 변경 예약)
            await change_subscription_plan(request, factory_id, payload, existing_history.id)

            scheduled_result = PaymentResultOut(
                subscription_id=subscription.id,
                subscription_type=subscription.type,
                payment_key="",
                order_id=f"plan_change_{factory_id}_{int(timezone.now().timestamp())}",
                amount=0,
                status="DONE",
                approved_at=timezone.now(),
                method="PLAN_CHANGE_SCHEDULED",
                card_company=None,
                card_type=None,
                card_number=None,
                card_owner_type=None,
            )
            return 200, scheduled_result

    # 3️⃣ 활성 구독 없음 -> 새 결제 진행
    toss_service = TossPaymentsService()
    order_id = f"subscription_{factory_id}_{int(timezone.now().timestamp())}"

    # 활성 구독이 없고, 동일 플랜의 취소 이력도 없을 때
    # PaymentAuth에서 빌링키 확인
    try:
        payment_auth = await PaymentAuth.objects.aget(
            factory=factory,
            billing_key=payload.billing_key,
            customer_key=payload.customer_key,
        )
    except PaymentAuth.DoesNotExist:
        logger.warning(
            f"PaymentAuth not found for factory_id={factory_id}, billing_key={payload.billing_key}"
        )
        raise HttpError(400, "유효하지 않은 빌링키입니다.")

    try:
        # 토스페이먼츠 결제 요청
        payment_result = toss_service.request_billing_payment(
            billing_key=payload.billing_key,
            customer_key=payload.customer_key,
            amount=int(subscription.price),
            order_id=order_id,
            order_name=f"{subscription.type} 플랜 구독료",
        )

        # 카드 정보는 card 객체 하위에 포함됨
        card_info = payment_result.get("card", {})
        issuer_code = str(card_info.get("issuerCode") or "")
        resolved_company = resolve_card_company_from_issuer(issuer_code)

        @sync_to_async
        @transaction.atomic
        def create_payment_and_subscription() -> tuple[Payment, SubscriptionHistory]:
            """새 구독 이력을 생성하고 결제와 연결"""
            # 1) 새 구독 이력 생성 (한 달 단위)
            from dateutil.relativedelta import relativedelta

            # 직전 이력의 종료일을 확인하여 중복기간 방지
            latest_history = (
                SubscriptionHistory.objects.filter(factory=factory)
                .order_by("-end_date")
                .first()
            )
            today = timezone.now().date()
            start_date = max(today, latest_history.end_date) if latest_history else today

            target_history = SubscriptionHistory.objects.create(
                factory=factory,
                subscription=subscription,
                start_date=start_date,
                end_date=(timezone.now() + relativedelta(months=1)).date(),
                billing_key=payload.billing_key,
                customer_key=payload.customer_key,
            )

            # 2) Payment 객체 생성 (결제 성공 시에만)
            payment = Payment.objects.create(
                subscription_history=target_history,
                payment_key=payment_result.get("paymentKey"),
                order_id=order_id,
                amount=subscription.price,
                status="DONE",
                method=payment_result.get("method"),
                approved_at=timezone.now(),
                # 카드 정보 저장
                card_company=resolved_company,
                card_type=card_info.get("cardType"),
                card_number=card_info.get("number"),
                card_owner_type=card_info.get("ownerType"),
            )

            return payment, target_history

        payment, subscription_history = await create_payment_and_subscription()

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
            approved_at=payment.approved_at,
            method=payment_result.get("method"),
            # 카드 정보
            card_company=resolved_company,
            card_type=card_info.get("cardType"),
            card_number=card_info.get("number"),
            card_owner_type=card_info.get("ownerType"),
        )

        logger.info(
            f"구독 결제 성공: factory_id={factory_id}, payment_key={payment_result.get('paymentKey')}"
        )
        return 200, result

    except (PaymentError, BillingKeyError) as e:
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
        .select_related("subscription_history__subscription")
        .order_by("-created_at")
        .first
    )()

    is_active = current_subscription.end_date > timezone.now().date()

    result = SubscriptionStatusOut(
        subscription_history=SubscriptionHistoryOut.from_orm(current_subscription),
        current_payment=PaymentOut.from_orm(latest_payment) if latest_payment else None,
        next_billing_date=(
            current_subscription.end_date.isoformat()
            if is_active and not current_subscription.is_canceled
            else None
        ),
        # 활성 여부는 기간 기준으로만 판단 (해지되었어도 기간 내에는 구독 활성이 true)
        is_active=is_active,
    )

    return result


@router.delete(
    "/scheduled-history/{factory_id}",
    summary="[C] 예정된 구독 취소",
    description="다음 예정된 구독을 취소합니다. 현재 구독은 유지되고 다음 구독만 삭제됩니다.",
    response={200: dict},
    auth=jwt_auth,
)
async def cancel_scheduled_subscription(request, factory_id: int):
    """예정된 구독 취소"""
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
        raise HttpError(404, "현재 활성 구독이 없습니다.")

    # 다음 날에 시작하는 예정된 구독 조회
    from datetime import timedelta as _td
    next_day = current_subscription.end_date + _td(days=1)
    
    scheduled_subscription = await sync_to_async(
        SubscriptionHistory.objects.filter(
            factory=factory,
            start_date=next_day,
            is_canceled=False,
        )
        .first
    )()

    if not scheduled_subscription:
        raise HttpError(404, "예정된 구독이 없습니다.")

    # 예정된 구독 삭제
    @sync_to_async
    @transaction.atomic
    def delete_scheduled_subscription():
        scheduled_subscription.delete()
        return True

    await delete_scheduled_subscription()

    logger.info(f"예정된 구독 취소 성공: factory_id={factory_id}, scheduled_subscription_id={scheduled_subscription.id}")
    return {"message": "예정된 구독이 성공적으로 취소되었습니다."}


@router.post(
    "/cancel/{payment_id}",
    summary="[C] 결제 취소",
    description="구독 결제를 취소합니다. 환불하지 않고 다음 달 자동 결제를 중단합니다. 세금계산서 조회 및 발행 기능은 현재 구독 기간이 끝나면 중단됩니다.",
    response=PaymentCancelOut,
    auth=jwt_auth,
)
async def cancel_payment(request, payment_id: int, payload: PaymentCancelIn):
    """결제 취소 - 다음 달 자동 갱신 중단"""
    user = request.auth
    payment = await get_payment_by_id(payment_id)

    # 권한 확인
    subscription_history = payment.subscription_history
    member = await is_factory_member(subscription_history.factory.id, user)

    if payment.status != "DONE":
        raise HttpError(400, "완료된 결제만 취소할 수 있습니다.")

    if subscription_history.is_canceled:
        raise HttpError(400, "이미 취소된 구독입니다.")

    @sync_to_async
    @transaction.atomic
    def update_subscription_canceled():
        # 구독 히스토리를 취소 상태로 변경 (현재 기간은 유지)
        subscription_history.is_canceled = True
        subscription_history.save()

        # 결제 상태는 그대로 유지 (환불하지 않음)
        return subscription_history

    await update_subscription_canceled()

    # 구독 취소 시 바로빌 스크랩은 즉시 정지하지 않고 구독 기간이 끝나면 자동으로 정지됨
    
    #  # basic, partners 구독 취소 시 바로빌 홈택스 스크랩 정지
    # subscription = subscription_history.subscription
    # factory = subscription_history.factory
    # try:
    #     await handle_barobill_scrap_for_subscription(
    #         factory, subscription.type, "deactivate"
    #     )
    # except Exception as e:
    #     logger.error(
    #         f"바로빌 홈택스 스크랩 정지 실패: factory_id={factory.id}, error={str(e)}"
    #     )
    #     # 스크랩 정지 실패해도 구독 취소는 성공으로 처리

    result = PaymentCancelOut(
        payment_key=payment.payment_key,
        cancel_amount=0,  # 환불 금액은 0 (환불하지 않음)
        cancel_reason=payload.cancel_reason,
        canceled_at=timezone.now(),
    )

    logger.info(f"구독 취소 성공 (다음 달 자동 갱신 중단): payment_id={payment_id}")
    return result


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

    if current_subscription.is_canceled:
        raise HttpError(400, "취소된 구독은 갱신할 수 없습니다.")

    if not current_subscription.billing_key:
        raise HttpError(400, "빌링키가 없습니다. 새로 결제를 진행해주세요.")

    # 다음 달 구독(플랜 변경 예정분) 있는지 확인: 기존 end_date + 1일부터 시작하는 구독
    from datetime import timedelta as _td
    next_subscription = await sync_to_async(
        lambda: SubscriptionHistory.objects.filter(
            factory=factory,
            start_date=current_subscription.end_date + _td(days=1),
            is_canceled=False,
        )
        .select_related("subscription")
        .first()
    )()

    target_subscription = next_subscription if next_subscription else current_subscription

    billing_service = SubscriptionBillingService()

    try:
        payment = billing_service.process_subscription_payment(target_subscription)

        # basic, partners 구독 갱신 시 바로빌 홈택스 스크랩 상태 확인 및 등록
        subscription = target_subscription.subscription
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
