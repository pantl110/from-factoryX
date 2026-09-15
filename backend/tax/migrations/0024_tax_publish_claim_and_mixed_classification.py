from django.db import migrations, models
import tax.models


def classify_legacy_mixed_documents(apps, schema_editor):
    NationalTaxService = apps.get_model("tax", "NationalTaxService")
    for document in NationalTaxService.objects.filter(tax_type="unclassified"):
        item_tax_types = {
            item.get("tax_type")
            for item in (document.line_items or [])
            if item.get("tax_type") in {"taxable", "exempt"}
        }
        if item_tax_types == {"taxable", "exempt"}:
            NationalTaxService.objects.filter(id=document.id).update(tax_type="mixed")


class Migration(migrations.Migration):

    dependencies = [
        ("tax", "0023_nationaltaxservice_publish_attempt_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="nationaltaxservice",
            name="mgt_key",
            field=models.CharField(
                default=tax.models.generate_mgt_key,
                help_text="관리 키",
                max_length=50,
            ),
        ),
        migrations.AlterField(
            model_name="nationaltaxservice",
            name="publish_status",
            field=models.CharField(
                choices=[
                    ("temporary", "임시 저장"),
                    ("pending", "전송 대기"),
                    ("publishing", "외부 발행 중"),
                    ("processing", "처리 중"),
                    ("published", "발행 완료"),
                    ("canceled", "발행 취소"),
                    ("failed", "발행 실패"),
                ],
                default="temporary",
                help_text="발행 상태",
                max_length=10,
            ),
        ),
        migrations.RunPython(
            classify_legacy_mixed_documents,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="nationaltaxservice",
            name="tax_type",
            field=models.CharField(
                choices=[
                    ("unclassified", "미분류"),
                    ("mixed", "과세·면세 혼합"),
                    ("taxable", "과세"),
                    ("zero_rated", "영세율"),
                    ("exempt", "면세"),
                ],
                default="unclassified",
                help_text="과세 유형",
                max_length=20,
            ),
        ),
    ]
