from django.db import models
from common.models import BaseModel
from factory.models import FactoryMember


# Create your models here.
class Notification(BaseModel):
    class NotificationType(models.TextChoices):
        warning = ("warning", "경고")
        information = ("information", "정보")
        completed = ("completed", "완료")

    class NotificationCase(models.TextChoices):
        material_lack = ("material_lack", "자재 부족")
        project_warning = ("project_warning", "프로젝트 생산 계획 이상")
        product_completed = ("product_completed", "제품 생산 완료")
        sales_tax_invoice_published = (
            "sales_tax_invoice_published",
            "매출 세금계산서 발행 완료",
        )
        purchase_tax_invoice_published = (
            "purchase_tax_invoice_published",
            "매입 세금계산서 발행 완료",
        )
        cash_receipt_published = ("cash_receipt_published", "영수증 발행 완료")
        permission_changed = ("permission_changed", "권한 변경")
        due_date_approaching = ("due_date_approaching", "납기일 임박")  # 3일
        production_schedule_changed = ("production_schedule_changed", "생산 일정 변경")

    receiver = models.ForeignKey(
        FactoryMember,
        related_name="notifications",
        on_delete=models.CASCADE,
        help_text="수신자",
    )
    type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.warning,
        help_text="알림 유형",
    )
    case = models.CharField(
        max_length=30,
        choices=NotificationCase.choices,
        default=NotificationCase.material_lack,
        help_text="알림 사유",
    )
    content = models.TextField(help_text="알림 내용")
    is_read = models.BooleanField(
        default=False,
        help_text="읽음 여부",
    )
