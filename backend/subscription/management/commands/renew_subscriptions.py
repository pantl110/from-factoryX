from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from subscription.models import SubscriptionHistory, Payment
from subscription.services import SubscriptionBillingService
from subscription.exceptions import PaymentError, BillingKeyError
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

        expiring_subscriptions = SubscriptionHistory.objects.filter(
            end_date=target_date,
            billing_key__isnull=False,  # 빌링키가 있는 것만
        ).select_related("subscription", "factory")

        total_count = expiring_subscriptions.count()

        if total_count == 0:
            self.stdout.write(
                self.style.SUCCESS(f"{days}일 후 만료되는 구독이 없습니다.")
            )
            return

        self.stdout.write(f"{days}일 후 만료되는 구독 {total_count}건을 찾았습니다.")

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

        # 실제 갱신 처리
        billing_service = SubscriptionBillingService()
        success_count = 0
        failed_count = 0

        for subscription in expiring_subscriptions:
            try:
                self.stdout.write(
                    f"구독 갱신 시작: {subscription.factory.name} - {subscription.subscription.type}"
                )

                payment = billing_service.process_subscription_payment(subscription)

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
