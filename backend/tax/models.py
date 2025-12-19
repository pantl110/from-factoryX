from django.db import models
from common.models import BaseModel
from factory.models import FactoryClient, Factory
import random


class TransactionType(models.TextChoices):
    receipt = ("receipt", "영수")
    invoice = ("invoice", "청구")


class TaxInvoiceType(models.TextChoices):
    sales = ("sales", "매출")
    purchase = ("purchase", "매입")


class PublishStatus(models.TextChoices):
    temporary = ("temporary", "임시 저장")  # 바로빌에 넘기기 전 상태
    pending = ("pending", "전송 대기")  # 바로빌에만 넘어간 상태
    processing = ("processing", "처리 중")  # 바로빌에서 국세청 넘어간 상태
    published = ("published", "발행 완료")  # 국세청에서 데이터 가져온 상태
    canceled = (
        "canceled",
        "발행 취소",
    )  # 전송 대기일 때만 가능 - 바로빌에서 국세청 가기 전에 한 취소를 의미
    failed = ("failed", "발행 실패")  # 국세청에서 거부된 상태


# 국세청 API 세금계산서 데이터 저장
class NationalTaxService(BaseModel):  # 거래명세서 같이 사용
    # factory? 공장 = 회사
    user = models.ForeignKey(
        "user.User",
        related_name="national_tax_services",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="사용자",
    )
    factory = models.ForeignKey(
        "factory.Factory",
        related_name="national_tax_services",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    factory_info = models.JSONField(
        default=dict,
        null=True,
        blank=True,
        help_text="공장 정보",
    )
    publish_status = models.CharField(
        max_length=10,
        choices=PublishStatus.choices,
        default=PublishStatus.temporary,
        help_text="발행 상태",
    )
    tax_invoice_type = models.CharField(
        max_length=10,
        choices=TaxInvoiceType.choices,
        default=TaxInvoiceType.sales,
        help_text="세금계산서 유형",
    )
    transaction_type = models.CharField(
        max_length=10,
        choices=TransactionType.choices,
        default=TransactionType.receipt,
        help_text="거래 유형",
    )
    transaction_date = models.DateField(null=True, blank=True, help_text="거래 일자")
    client = models.ForeignKey(
        FactoryClient,
        related_name="tax_invoices",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="거래처",
    )
    client_info = models.JSONField(
        default=dict,
        null=True,
        blank=True,
        help_text="거래처 정보",
    )
    transaction_amount = models.IntegerField(
        null=True, blank=True, help_text="공급 가액"
    )
    tax_amount = models.IntegerField(null=True, blank=True, help_text="세액")
    is_hidden = models.BooleanField(default=False, help_text="숨김 여부")
    mgt_key = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="관리 키",
    )
    nts_send_key = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="국세청 승인번호",
    )
    barobill_state = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="바로빌 상태",
    )
    nts_send_state = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        help_text="국세청 전송 상태",
    )
    # 세금계산서 발행할 필요한 정보들...
    line_items = models.JSONField(
        default=list,
        blank=True,
        help_text="세금계산서 품목 리스트",
    )

    def save(self, *args, **kwargs):
        if not self.mgt_key:
            # Generate a unique management key
            new_key = "".join(random.choices("0123456789", k=20))
            while NationalTaxService.objects.filter(mgt_key=new_key).exists():
                new_key = "".join(random.choices("0123456789", k=20))
            self.mgt_key = new_key
        
        # 이전 상태 확인을 위해 저장 전에 체크
        was_published = False
        if self.pk:
            try:
                old_instance = NationalTaxService.objects.get(pk=self.pk)
                was_published = old_instance.publish_status == "published"
            except NationalTaxService.DoesNotExist:
                pass
        
        result = super().save(*args, **kwargs)
        
        # 발행 완료 상태가 되고, TaxInvoiceAccount가 없으면 자동 생성
        if self.publish_status == "published" and not was_published:
            if not TaxInvoiceAccount.objects.filter(tax_invoice=self).exists():
                # transaction_amount(공급가액)와 tax_amount를 합산하여 total_billed_amount 계산
                total_billed_amount = (self.transaction_amount or 0) + (self.tax_amount or 0)
                TaxInvoiceAccount.objects.create(
                    tax_invoice=self,
                    status=AccountStatus.waiting,  # 채권/채무 상태를 대기로 초기화
                    invoice_sent_count=0,  # 청구서 발송 횟수 초기화
                    total_billed_amount=total_billed_amount,
                    outstanding_balance=total_billed_amount,  # 미수금액은 청구금액과 동일하게 초기화
                )
        
        return result


# 국세청 API 현금 영수증 데이터 저장


class CashReceiptType(models.TextChoices):
    sales = ("sales", "매출")
    purchase = ("purchase", "매입")


class CashReceipt(BaseModel):
    user = models.ForeignKey(
        "user.User",
        related_name="cash_receipts",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="사용자",
    )
    factory = models.ForeignKey(
        "factory.Factory",
        related_name="cash_receipts",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    factory_info = models.JSONField(
        default=dict,
        null=True,
        blank=True,
        help_text="공장 정보",
    )
    cash_receipt_type = models.CharField(
        max_length=10,
        choices=CashReceiptType.choices,
        default=CashReceiptType.sales,
        help_text="현금 영수증 유형",
    )
    transaction_date = models.DateField(help_text="거래 일자")
    client = models.ForeignKey(
        FactoryClient,
        related_name="cash_receipts",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="거래처",
    )
    client_info = models.JSONField(
        default=dict,
        null=True,
        blank=True,
        help_text="거래처 정보",
    )
    transaction_amount = models.IntegerField(help_text="공급 가액")
    tax_amount = models.IntegerField(help_text="세액")
    service_charge = models.IntegerField(
        default=0,
        help_text="봉사료",
    )
    nts_confirm_num = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="국세청 승인번호",
    )
    franchise_corp_num = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="가맹점 사업자 등록번호",
    )
    franchise_corp_name = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="가맹점 상호명",
    )
    franchise_ceo_name = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="가맹점 대표자명",
    )
    franchise_addr = models.CharField(
        max_length=300,
        null=True,
        blank=True,
        help_text="가맹점 주소",
    )
    franchise_tel = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="가맹점 전화번호",
    )
    identity_num = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="소비자 신분확인번호(사업자번호/주민등록번호/등)",
    )
    trade_type = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        help_text="거래구분(승인거래/취소거래)",
    )
    trade_usage = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        help_text="거래용도(소득공제/지출증빙)",
    )
    trade_method = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        help_text="거래방법(카드번호, 주민등록번호, 사업자번호, 휴대폰번호)",
    )
    item_name = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="품목명",
    )
    cancel_type = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        help_text="취소사유(거래취소/오류발급/기타)",
    )
    cancel_nts_confirm_num = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="취소시 국세청 승인번호",
    )
    cancel_nts_confirm_date = models.DateField(
        null=True,
        blank=True,
        help_text="취소시 국세청 승인일자",
    )


# 세금계산서 채권/채무 정보
class AccountStatus(models.TextChoices):
    waiting = ("waiting", "대기")
    overdue = ("overdue", "연체")
    partial = ("partial", "일부")
    completed = ("completed", "완료")


class CollectionTerms(models.TextChoices):
    invoice_30 = ("INVOICE_30", "세금계산서 발행 후 30일 이내 입금")
    invoice_eom_next = ("INVOICE_EOM_NEXT", "세금계산서 발행 익월 말일 입금")
    custom = ("CUSTOM", "직접 입력")


class TaxInvoiceAccount(BaseModel):
    """세금계산서 채권/채무 정보 (매출채권 또는 매입채무)"""
    tax_invoice = models.OneToOneField(
        NationalTaxService,
        related_name="tax_invoice_account",
        on_delete=models.CASCADE,
        help_text="세금계산서",
    )
    status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.waiting,
        help_text="채권/채무 상태",
    )
    invoice_sent_count = models.IntegerField(
        default=0,
        help_text="청구서 발송 횟수",
    )
    # 업체명은 tax_invoice.client.name에서 가져올 수 있음
    total_billed_amount = models.IntegerField(
        help_text="청구금액(합계)"
    )
    outstanding_balance = models.IntegerField(
        default=0,
        help_text="미수금액(잔액)"
    )
    collection_terms = models.CharField(
        max_length=50,
        choices=CollectionTerms.choices,
        null=True,
        blank=True,
        help_text="수금 조건",
    )
    collection_terms_custom = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="수금 조건 직접 입력 (collection_terms가 CUSTOM일 때만 사용)",
    )
    agreed_payment_date = models.DateField(
        null=True,
        blank=True,
        help_text="약정 입금일",
    )
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="특이사항",
    )



# 회수/지급 상세 내역
class PaymentDetail(BaseModel):
    """회수/지급 상세 내역 (매출채권의 경우 회수, 매입채무의 경우 지급)"""
    tax_invoice_account = models.ForeignKey(
        TaxInvoiceAccount,
        related_name="payment_details",
        on_delete=models.CASCADE,
        help_text="세금계산서 채권/채무",
    )
    payment_date = models.DateField(
        help_text="입금일/지급일"
    )
    amount_received = models.IntegerField(
        help_text="받은 금액/지급 금액"
    )
    outstanding_amount_at_payment = models.IntegerField(
        help_text="미수금액/미지급금액"
    )
    expected_payment_date = models.DateField(
        null=True,
        blank=True,
        help_text="입금예정일"
    )
