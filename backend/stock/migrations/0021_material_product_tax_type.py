from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("stock", "0020_alter_product_unique_together"),
    ]

    operations = [
        migrations.AddField(
            model_name="material",
            name="tax_type",
            field=models.CharField(
                choices=[("taxable", "과세"), ("exempt", "면세")],
                default="taxable",
                help_text="기본 과세 유형",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="tax_type",
            field=models.CharField(
                choices=[("taxable", "과세"), ("exempt", "면세")],
                default="taxable",
                help_text="기본 과세 유형",
                max_length=20,
            ),
        ),
    ]
