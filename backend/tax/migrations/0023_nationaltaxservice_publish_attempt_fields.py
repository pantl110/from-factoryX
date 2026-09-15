from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tax", "0022_taxdocumentgroup_nationaltaxservice_document_group"),
    ]

    operations = [
        migrations.AddField(
            model_name="nationaltaxservice",
            name="last_publish_attempt_at",
            field=models.DateTimeField(
                blank=True,
                help_text="마지막 외부 발행 시도 시각",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="nationaltaxservice",
            name="last_publish_error",
            field=models.TextField(
                blank=True,
                default="",
                help_text="마지막 외부 발행 실패 사유",
            ),
        ),
        migrations.AddField(
            model_name="nationaltaxservice",
            name="publish_attempt_count",
            field=models.PositiveIntegerField(
                default=0,
                help_text="외부 발행 시도 횟수",
            ),
        ),
    ]
