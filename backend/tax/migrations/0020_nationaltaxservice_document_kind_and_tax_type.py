from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tax", "0019_cashreceipt_is_hidden"),
    ]

    operations = [
        migrations.AddField(
            model_name="nationaltaxservice",
            name="document_kind",
            field=models.CharField(
                choices=[
                    ("tax_invoice", "전자세금계산서"),
                    ("invoice", "전자계산서"),
                ],
                default="tax_invoice",
                help_text="문서 종류",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="nationaltaxservice",
            name="tax_type",
            field=models.CharField(
                choices=[
                    ("unclassified", "미분류"),
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
