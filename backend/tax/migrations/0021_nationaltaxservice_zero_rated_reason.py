from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tax", "0020_nationaltaxservice_document_kind_and_tax_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="nationaltaxservice",
            name="zero_rated_reason",
            field=models.CharField(
                blank=True,
                help_text="영세율 적용 사유",
                max_length=200,
                null=True,
            ),
        ),
    ]
