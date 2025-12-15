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
        return super().save(*args, **kwargs)


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
