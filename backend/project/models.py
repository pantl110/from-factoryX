from django.db import models
from common.models import BaseModel
from document.models import QuotationProduct
from factory.models import FactoryEquipment


# Create your models here.
class Project(BaseModel):
    class ProjectStatus(models.TextChoices):
        quotation = ("quotation", "견적 협의중")
        confirmed = ("confirmed", "주문 확정")
        pending = ("pending", "생산 대기")
        production = ("production", "생산 중")
        manufactured = ("manufactured", "생산 완료")
        delivery = ("delivery", "납품")
        completed = ("completed", "프로젝트 완료")
        suspended = ("suspended", "중단")

    class TaxInvoiceStatus(models.TextChoices):
        pending = ("pending", "미발행")
        processing = ("processing", "발행 중")
        completed = ("completed", "발행 완료")

    name = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="프로젝트명",
    )
    status = models.CharField(
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.quotation,
    )
    is_refunded = models.BooleanField(
        default=False,
        help_text="반품 여부",
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
    printed_at = models.DateField(
        null=True,
        blank=True,
        help_text="거래명세서 출력 일자",
    )
    confirmed_at = models.DateField(
        null=True,
        blank=True,
        help_text="견적서 -> 주문 확정 일자",
    )
    pending_at = models.DateField(
        null=True,
        blank=True,
        help_text="주문 확정 -> 생산 대기 일자",
    )


# 생산 계획(내역)
class ProjectPlan(BaseModel):
    class ProductionStatus(models.TextChoices):
        pending = ("pending", "가동 대기")
        production = ("production", "가동 중")
        completed = ("completed", "가동 완료")
        impossible = ("impossible", "가동 불가")

    project = models.ForeignKey(Project, related_name="plans", on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=ProductionStatus.choices,
        default=ProductionStatus.pending,
    )
    product = models.ForeignKey(
        QuotationProduct,
        related_name="plans",
        on_delete=models.CASCADE,
    )
    quantity = models.IntegerField(help_text="생산 수량")
    defective_quantity = models.IntegerField(
        null=True, blank=True, help_text="불량품 수량"
    )
    equipment = models.ForeignKey(
        FactoryEquipment, related_name="plans", on_delete=models.CASCADE
    )
    start_date = models.DateTimeField(help_text="생산 시작 일시")
    end_date = models.DateTimeField(help_text="마감 예정 일시")
    avg_production_time = models.IntegerField(help_text="평균 생산 시간(초)")
    end_notification = models.BooleanField(
        default=False,
        help_text="생산 완료 알림 여부",
    )

    # 원자재 소모 처리 여부
    material_consumed = models.BooleanField(
        default=False,
        help_text="해당 생산 계획에 대한 원자재 소모 처리가 완료되었는지 여부",
    )


# 생산 로그
class ProjectLog(BaseModel):
    class LogType(models.TextChoices):
        date = ("date", "생산 일자 변경")
        equipment = ("equipment", "생산 설비 변경")
        memo = ("memo", "메모")
        refund = ("refund", "반품")

    project = models.ForeignKey(Project, related_name="logs", on_delete=models.CASCADE)
    type = models.CharField(
        max_length=20,
        choices=LogType.choices,
        default=LogType.date,
    )
    title = models.CharField(max_length=100, help_text="로그 제목")
    content = models.TextField(help_text="로그 내용")
    refund = models.ForeignKey(
        "project.Refund",
        related_name="logs",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="반품 정보",
    )


# 반품 등록
class Refund(BaseModel):
    product = models.ForeignKey(
        "stock.Product", related_name="refunds", on_delete=models.CASCADE
    )
    plan = models.ForeignKey(
        ProjectPlan,
        related_name="refunds",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    amount = models.IntegerField(help_text="반품 수량")
    refund_date = models.DateField(help_text="반품 일자")
    current_stock = models.IntegerField(help_text="현재 재고")  # 그 당시 현재 재고
    production_amount = models.IntegerField(
        null=True, blank=True, help_text="생산 수량"
    )


# 프로젝트 플랜별 자재 사용 내역
class ProjectPlanMaterialUsage(BaseModel):
    """프로젝트 플랜에서 실제 사용한 자재 정보를 저장하는 모델"""

    plan = models.ForeignKey(
        ProjectPlan,
        related_name="material_usages",
        on_delete=models.CASCADE,
        help_text="생산 계획",
    )
    original_material = models.ForeignKey(
        "stock.Material",
        related_name="original_plan_usages",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="원래 계획된 자재 ID",
    )
    material = models.ForeignKey(
        "stock.Material",
        related_name="plan_usages",
        on_delete=models.CASCADE,
        help_text="실제 사용한 자재 ID (대체 자재일 수도 있음)",
    )
    material_history = models.ForeignKey(
        "stock.MaterialHistory",
        related_name="plan_usages",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="사용한 자재 이력 (MaterialHistory 또는 MaterialRepackaging 중 하나만 설정)",
    )
    material_repackaging = models.ForeignKey(
        "repackaging.MaterialRepackaging",
        related_name="plan_usages",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="사용한 자재 소분 내역 (MaterialHistory 또는 MaterialRepackaging 중 하나만 설정)",
    )
    usage_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="실제 투입량",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "프로젝트 플랜 자재 사용 내역"
        verbose_name_plural = "프로젝트 플랜 자재 사용 내역"

    def __str__(self):
        return f"{self.plan.id} - {self.material.name}: {self.usage_amount}"
