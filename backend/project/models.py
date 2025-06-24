from django.db import models
from common.models import BaseModel
from document.models import Quotation, QuotationProduct, FinancialDocument
from factory.models import FactoryEquipment


# Create your models here.
class Project(BaseModel):
    class ProjectStatus(models.TextChoices):
        quotation = ("견적 협의중", "quotation")
        pending = ("생산 대기", "pending")
        production = ("생산 중", "production")
        manufactured = ("생산 완료", "manufactured")
        delivery = ("납품", "delivery")
        completed = ("프로젝트 완료", "completed")

    class TaxInvoiceStatus(models.TextChoices):
        pending = ("미발행", "pending")
        processing = ("발행 중", "processing")
        completed = ("발행 완료", "completed")

    quotation = models.ForeignKey(
        Quotation, on_delete=models.CASCADE, help_text="견적서"
    )
    status = models.CharField(
        max_length=10,
        choices=ProjectStatus.choices,
        default=ProjectStatus.quotation,
    )
    is_transaction_publish = models.BooleanField(
        default=False,
        help_text="거래명세서 발행 여부",
    )
    tax_invoice_status = models.CharField(
        max_length=10,
        choices=TaxInvoiceStatus.choices,
        default=TaxInvoiceStatus.pending,
        help_text="세금계산서 발행 상태",
    )
    transact_date = models.DateField(
        null=True,
        blank=True,
        help_text="거래명세서 발행 일자",
    )
    tax_invoice_date = models.DateField(
        null=True,
        blank=True,
        help_text="세금계산서 발행 일자",
    )


# 생산 계획(내역)
class ProjectPlan(BaseModel):
    class ProductionStatus(models.TextChoices):
        pending = ("가동 대기", "pending")
        production = ("가동 중", "production")
        completed = ("가동 완료", "completed")
        impossible = ("가동 불가", "impossible")

    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=10,
        choices=ProductionStatus.choices,
        default=ProductionStatus.pending,
    )
    product = models.ForeignKey(QuotationProduct, on_delete=models.CASCADE)
    quantity = models.IntegerField(help_text="생산 수량")
    equipment = models.ForeignKey(FactoryEquipment, on_delete=models.CASCADE)
    start_date = models.DateField(help_text="생산 일자")
    end_date = models.DateField(help_text="마감 예정 일자")
    avg_production_time = models.IntegerField(help_text="평균 생산 시간(초)")


# 생산 로그
class ProjectLog(BaseModel):
    class LogType(models.TextChoices):
        plan = ("계획 변경", "plan")
        memo = ("메모", "memo")
        refund = ("반품", "refund")

    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    type = models.CharField(
        max_length=10,
        choices=LogType.choices,
        default=LogType.plan,
    )
    title = models.CharField(max_length=100, help_text="로그 제목")
    content = models.TextField(help_text="로그 내용")
