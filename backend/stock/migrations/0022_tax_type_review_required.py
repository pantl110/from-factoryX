from django.db import migrations, models


def mark_existing_records_for_review(apps, schema_editor):
    Material = apps.get_model("stock", "Material")
    Product = apps.get_model("stock", "Product")

    Material.objects.all().update(tax_type_review_required=True)
    Product.objects.all().update(tax_type_review_required=True)


def clear_review_flags(apps, schema_editor):
    Material = apps.get_model("stock", "Material")
    Product = apps.get_model("stock", "Product")

    Material.objects.all().update(tax_type_review_required=False)
    Product.objects.all().update(tax_type_review_required=False)


class Migration(migrations.Migration):
    dependencies = [
        ("stock", "0021_material_product_tax_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="material",
            name="tax_type_review_required",
            field=models.BooleanField(
                default=False,
                help_text="기존 데이터의 과세 유형 확인 필요 여부",
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="tax_type_review_required",
            field=models.BooleanField(
                default=False,
                help_text="기존 데이터의 과세 유형 확인 필요 여부",
            ),
        ),
        migrations.RunPython(mark_existing_records_for_review, clear_review_flags),
    ]
