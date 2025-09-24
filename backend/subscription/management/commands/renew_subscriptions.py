from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from subscription.models import SubscriptionHistory, Payment
from subscription.services import SubscriptionBillingService
from subscription.exceptions import PaymentError, BillingKeyError
from subscription.barobill_utils import handle_barobill_scrap_for_subscription
import asyncio
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "구독 자동 갱신 작업 - 만료 예정인 구독들을 자동으로 갱신합니다."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="실제 결제를 진행하지 않고 대상만 확인합니다.",
        )
        parser.add_argument(
            "--days",
            type=int,
            default=1,
            help="며칠 후 만료되는 구독을 대상으로 할지 지정합니다 (기본값: 1일)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        days = options["days"]

        # 지정된 일수 후에 만료되는 구독들을 찾음
        target_date = timezone.now().date() + timedelta(days=days)

        # 구독 자동 갱신 대상: 만료 예정이고 빌링키가 있으며 취소되지 않은 구독
        expiring_subscriptions = SubscriptionHistory.objects.filter(
            end_date=target_date,
            billing_key__isnull=False,  # 빌링키가 있는 것만
            is_canceled=False,  # 취소되지 않은 것만
        ).select_related("subscription", "factory")

        # 취소된 구독 중 만료되는 것들 (스크랩 정지 대상)
        canceled_expiring_subscriptions = SubscriptionHistory.objects.filter(
            end_date=target_date,
            is_canceled=True,  # 취소된 것만
        ).select_related("subscription", "factory")

        total_count = expiring_subscriptions.count()
        canceled_count = canceled_expiring_subscriptions.count()

        if total_count == 0 and canceled_count == 0:
            self.stdout.write(
                self.style.SUCCESS(f"{days}일 후 만료되는 구독이 없습니다.")
            )
            return
        self.stdout.write(f"{days}일 후 만료되는 구독 {total_count}건을 찾았습니다.")
        
        if canceled_count > 0:
            self.stdout.write(f"취소된 구독 중 만료되는 것 {canceled_count}건 (스크랩 정지 대상)")

        if dry_run:
            self.stdout.write(
                self.style.WARNING("DRY RUN 모드 - 실제 결제는 진행되지 않습니다.")
            )
            for subscription in expiring_subscriptions:
                self.stdout.write(
                    f"- 공장: {subscription.factory.name} | "
                    f"플랜: {subscription.subscription.type} | "
                    f"만료일: {subscription.end_date} | "
                    f"금액: {subscription.subscription.price}원"
                )
            return

        # 취소된 구독의 스크랩 정지 처리
        if canceled_count > 0:
            self.stdout.write("취소된 구독의 스크랩 정지 처리 시작...")
            for subscription in canceled_expiring_subscriptions:
                try:
                    asyncio.run(
                        handle_barobill_scrap_for_subscription(
                            subscription.factory,
                            subscription.subscription.type,
                            "deactivate",
                        )
                    )
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✅ 취소된 구독 스크랩 정지 성공: {subscription.factory.name}"
                        )
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f"❌ 취소된 구독 스크랩 정지 실패: {subscription.factory.name} - {str(e)}"
                        )
                    )
                    logger.error(
                        f"취소된 구독 스크랩 정지 실패: factory_id={subscription.factory.id}, error={str(e)}"
                    )

        # 실제 갱신 처리
        billing_service = SubscriptionBillingService()
        success_count = 0
        failed_count = 0

        for subscription in expiring_subscriptions:
            try:
                # 다음 구독이 있는지 확인 (플랜이 변경된 경우 확인)
                # 현재 구독 종료일 + 1일부터 시작하는 구독 찾기
                next_subscription = SubscriptionHistory.objects.filter(
                    factory=subscription.factory,
                    start_date=subscription.end_date + timedelta(days=1),
                    is_canceled=False,
                ).first()
                
                if next_subscription:
                    # 다음 달 구독이 있으면 해당 구독으로 갱신
                    self.stdout.write(
                        f"구독 플랜 변경 갱신: {subscription.factory.name} - "
                        f"{subscription.subscription.type} → {next_subscription.subscription.type}"
                    )
                    payment = billing_service.process_subscription_payment(next_subscription)
                else:
                    # 다음 달 구독이 없으면 기존 구독으로 갱신
                    self.stdout.write(
                        f"구독 갱신 시작: {subscription.factory.name} - {subscription.subscription.type}"
                    )
                    payment = billing_service.process_subscription_payment(subscription)

                # basic, partners 구독 갱신 시 바로빌 홈택스 스크랩 등록
                try:
                    # 사용할 구독 결정 (다음 달 구독이 있으면 그것, 없으면 기존 구독)
                    target_subscription = next_subscription if next_subscription else subscription
                    
                    # async 함수를 동기적으로 호출
                    asyncio.run(
                        handle_barobill_scrap_for_subscription(
                            target_subscription.factory,
                            target_subscription.subscription.type,
                            "renew",
                        )
                    )
                    self.stdout.write(
                        f"✅ 바로빌 홈택스 스크랩 갱신 등록 성공: {subscription.factory.name}"
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(
                            f"⚠️ 바로빌 홈택스 스크랩 갱신 등록 실패: {subscription.factory.name} - {str(e)}"
                        )
                    )
                    logger.warning(
                        f"바로빌 홈택스 스크랩 갱신 등록 실패: factory_id={subscription.factory.id}, error={str(e)}"
                    )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"✅ 구독 갱신 성공: {subscription.factory.name} - "
                        f"결제키: {payment.payment_key} - 금액: {payment.amount}원"
                    )
                )
                success_count += 1

            except (PaymentError, BillingKeyError) as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"❌ 구독 갱신 실패: {subscription.factory.name} - {str(e)}"
                    )
                )
                failed_count += 1
                logger.error(
                    f"구독 갱신 실패: subscription_id={subscription.id}, error={str(e)}"
                )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"❌ 구독 갱신 중 예기치 못한 오류: {subscription.factory.name} - {str(e)}"
                    )
                )
                failed_count += 1
                logger.error(
                    f"구독 갱신 예기치 못한 오류: subscription_id={subscription.id}, error={str(e)}"
                )

        # 결과 요약
        self.stdout.write("=" * 50)
        self.stdout.write(f"구독 갱신 작업 완료")
        self.stdout.write(f"- 전체 대상: {total_count}건")
        self.stdout.write(self.style.SUCCESS(f"- 성공: {success_count}건"))
        if failed_count > 0:
            self.stdout.write(self.style.ERROR(f"- 실패: {failed_count}건"))
        else:
            self.stdout.write(f"- 실패: {failed_count}건")
