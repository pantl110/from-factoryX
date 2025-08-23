from django.db import models
from common.models import BaseModel
from factory.models import Factory, FactoryClient


# Create your models here.
class Quotation(BaseModel):  # 견적서 -> 주문서(거래 확정시 타입 변경)

    class QuotationType(models.TextChoices):
        QUOTATION = "quotation", "견적서"
        ORDER = "order", "주문서"

    type = models.CharField(
        max_length=10,
        choices=QuotationType.choices,
        default=QuotationType.QUOTATION,
        help_text="견적서 유형",
    )
    factory = models.ForeignKey(
        Factory,
        on_delete=models.CASCADE,
        related_name="quotations",
        null=True,
        blank=True,
        help_text="공장",
    )
    factory_info = models.JSONField(
        default=dict, null=True, blank=True, help_text="공장 정보"
    )
    client = models.ForeignKey(
        FactoryClient,
        on_delete=models.CASCADE,
        related_name="quotations",
        null=True,
        blank=True,
        help_text="거래처",
    )
    client_info = models.JSONField(
        default=dict, null=True, blank=True, help_text="거래처 정보"
    )
    project = models.ForeignKey(
        "project.Project",
        on_delete=models.CASCADE,
        related_name="quotations",
        help_text="프로젝트",
    )
    due_date = models.DateField(null=True, blank=True, help_text="납기일자")
    uploaded_file = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="업로드 파일",
    )
    due_date_notification = models.BooleanField(
        default=False, help_text="마감일 알림 여부"
    )
    products_info = models.JSONField(
        default=list,
        null=True,
        blank=True,
        help_text="주문 확정 시 제품들 정보 (반품 항목은 추가되지 않도록)",
    )


class QuotationProduct(BaseModel):
    quotation = models.ForeignKey(
        Quotation,
        on_delete=models.CASCADE,
        related_name="products",
        help_text="견적서",
    )
    product = models.ForeignKey(
        "stock.Product",
        on_delete=models.CASCADE,
        related_name="quotation_products",
        help_text="제품",
    )
    # product가 수정되어도 변경되지 않는 product의 정보를 저장
    product_info = models.JSONField(
        default=dict,
        null=True,
        blank=True,
        help_text="제품 정보",
    )
    quantity = models.IntegerField(help_text="수량")
    unit_price = models.IntegerField(help_text="단가")
    is_delivery = models.BooleanField(
        default=False,
        help_text="납품 여부",
    )
    delivery_date = models.DateField(
        null=True,
        blank=True,
        help_text="납품 일자",
    )


class WorkInstruction(BaseModel):
    plans = models.ManyToManyField(
        "project.ProjectPlan",
        blank=True,
        related_name="work_instructions",
        help_text="연결된 생산 계획들",
    )
    memo = models.TextField(help_text="메모", null=True, blank=True)
