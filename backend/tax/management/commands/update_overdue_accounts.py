from django.core.management.base import BaseCommand
from django.db import transaction
from tax.models import TaxInvoiceAccount, AccountStatus
from datetime import date
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = '약정지급일이 지난 채권/채무의 상태를 연체(overdue)로 업데이트합니다'

    def handle(self, *args, **options):
        """명령어 실행"""
        self.stdout.write('약정지급일이 지난 채권/채무 상태 업데이트를 시작합니다')
        
        try:
            with transaction.atomic():
                today = date.today()
                
                # 약정지급일이 지났고 잔액이 있지만 아직 overdue가 아닌 항목들 조회
                accounts_to_update = TaxInvoiceAccount.objects.filter(
                    agreed_payment_date__lt=today,
                    outstanding_balance__gt=0
                ).exclude(
                    status=AccountStatus.overdue
                )
                
                updated_count = 0
                
                for account in accounts_to_update:
                    account.status = AccountStatus.overdue
                    account.save(update_fields=["status"])
                    updated_count += 1
                    
                    # 로그 출력
                    if account.tax_invoice:
                        self.stdout.write(
                            f'세금계산서 {account.tax_invoice.id} - 상태를 연체로 변경'
                        )
                    elif account.cash_receipt:
                        self.stdout.write(
                            f'현금영수증 {account.cash_receipt.id} - 상태를 연체로 변경'
                        )
                
                self.stdout.write(
                    self.style.SUCCESS(f'업데이트 완료: {updated_count}개 항목')
                )
                
        except Exception as e:
            logger.error(f'채권/채무 상태 업데이트 중 오류 발생: {e}')
            self.stdout.write(
                self.style.ERROR(f'오류 발생: {e}')
            )
            raise
