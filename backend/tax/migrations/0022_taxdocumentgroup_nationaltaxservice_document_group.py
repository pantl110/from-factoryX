import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("factory", "0014_factorymember_dashboard_layout"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("tax", "0021_nationaltaxservice_zero_rated_reason"),
    ]

    operations = [
        migrations.CreateModel(
            name="TaxDocumentGroup",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, help_text="생성일")),
                ("updated_at", models.DateTimeField(auto_now=True, help_text="수정일")),
                ("group_key", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("source_line_items", models.JSONField(default=list)),
                ("source_transaction_amount", models.IntegerField(default=0)),
                ("source_tax_amount", models.IntegerField(default=0)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_tax_document_groups",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "factory",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tax_document_groups",
                        to="factory.factory",
                    ),
                ),
            ],
            options={"abstract": False},
        ),
        migrations.AddField(
            model_name="nationaltaxservice",
            name="document_group",
            field=models.ForeignKey(
                blank=True,
                help_text="혼합 거래 분리 문서 그룹",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="documents",
                to="tax.taxdocumentgroup",
            ),
        ),
    ]
