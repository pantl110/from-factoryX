from django.db import models
from common.models import BaseModel
from factory.models import Factory, FactoryClient


# Create your models here.
class Quotation(BaseModel):
    factory = models.ForeignKey(
        Factory,
        on_delete=models.CASCADE,
        related_name="quotations",
        help_text="공장",
    )
    client = models.ForeignKey(
        FactoryClient,
        on_delete=models.CASCADE,
        related_name="quotations",
        help_text="고객",
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
