from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("stock", "0023_increase_material_quantity_precision"),
    ]

    operations = [
        migrations.AlterField(
            model_name="materialhistory",
            name="type",
            field=models.CharField(
                choices=[
                    ("purchase", "구매"),
                    ("initial_stock", "기초재고"),
                    ("consumption", "소모"),
                ],
                default="purchase",
                max_length=20,
            ),
        ),
    ]
