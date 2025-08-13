from django.db import models
from common.models import BaseModel
from document.models import QuotationProduct
from factory.models import FactoryEquipment


# Create your models here.
class Project(BaseModel):
    class ProjectStatus(models.TextChoices):
        quotation = ("견적 협의중", "quotation")
        confirmed = ("주문 확정", "confirmed")
        pending = ("생산 대기", "pending")
        production = ("생산 중", "production")
        manufactured = ("생산 완료", "manufactured")
        delivery = ("납품", "delivery")
        completed = ("프로젝트 완료", "completed")
        suspended = ("중단", "suspended")

    class TaxInvoiceStatus(models.TextChoices):
        pending = ("미발행", "pending")
        processing = ("발행 중", "processing")
        completed = ("발행 완료", "completed")

    status = models.CharField(
        max_length=10,
        choices=ProjectStatus.choices,
        default=ProjectStatus.quotation,
    )
    transact_date = models.DateField(
        null=True,
        blank=True,
        help_text="거래명세서 발행 일자",  # 발행일자가 생기면 거래명세서 발행된 것. null이면 발행 안된 것.
    )
    tax_invoice = models.ForeignKey(
        "tax.NationalTaxService",
        related_name="projects",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="세금계산서",
    )


# 생산 계획(내역)
class ProjectPlan(BaseModel):
    class ProductionStatus(models.TextChoices):
        pending = ("가동 대기", "pending")
        production = ("가동 중", "production")
        completed = ("가동 완료", "completed")
        impossible = ("가동 불가", "impossible")

    project = models.ForeignKey(Project, related_name="plans", on_delete=models.CASCADE)
    status = models.CharField(
        max_length=10,
        choices=ProductionStatus.choices,
        default=ProductionStatus.pending,
    )
    product = models.ForeignKey(
        QuotationProduct,
        related_name="plans",
        on_delete=models.CASCADE,
    )
    quantity = models.IntegerField(help_text="생산 수량")
    equipment = models.ForeignKey(
        FactoryEquipment, related_name="plans", on_delete=models.CASCADE
    )
    start_date = models.DateField(help_text="생산 일자")
    end_date = models.DateField(help_text="마감 예정 일자")
    avg_production_time = models.IntegerField(help_text="평균 생산 시간(초)")
    is_completed = models.BooleanField(
        default=False,
        null=True,
        blank=True,
        help_text="생산 완료 여부",
    )
    is_refunded = models.BooleanField(
        null=True,
        blank=True,
        default=False,
        help_text="반품 여부",
    )


# 생산 로그
class ProjectLog(BaseModel):
    class LogType(models.TextChoices):
        plan = ("계획 변경", "plan")
        memo = ("메모", "memo")
        refund = ("반품", "refund")

    project = models.ForeignKey(Project, related_name="logs", on_delete=models.CASCADE)
    type = models.CharField(
        max_length=10,
        choices=LogType.choices,
        default=LogType.plan,
    )
    title = models.CharField(max_length=100, help_text="로그 제목")
    content = models.TextField(help_text="로그 내용")


# 반품 등록
class Refund(BaseModel):
    project_log = models.ForeignKey(
        ProjectLog, related_name="refunds", on_delete=models.CASCADE
    )
    product = models.ForeignKey(
        "stock.Product", related_name="refunds", on_delete=models.CASCADE
    )
    amount = models.IntegerField(help_text="반품 수량")
    refund_date = models.DateField(help_text="반품 일자")
    current_stock = models.IntegerField(help_text="현재 재고")  # 그 당시 현재 재고
    production_amount = models.IntegerField(
        null=True, blank=True, help_text="생산 수량"
    )
