from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("stock", "0022_tax_type_review_required"),
    ]

    operations = [
        migrations.AlterField(
            model_name="material",
            name="current_stock",
            field=models.DecimalField(
                decimal_places=4,
                default=Decimal("0.0000"),
                help_text="현재 재고",
                max_digits=14,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="material",
            name="standard_stock",
            field=models.DecimalField(blank=True, decimal_places=4, help_text="안전 재고", max_digits=14, null=True),
        ),
        migrations.AlterField(
            model_name="material",
            name="rop",
            field=models.DecimalField(blank=True, decimal_places=4, help_text="재주문점 (Reorder Point)", max_digits=14, null=True),
        ),
        migrations.AlterField(
            model_name="material",
            name="max_stock",
            field=models.DecimalField(blank=True, decimal_places=4, help_text="적정 재고(최대 재고)", max_digits=14, null=True),
        ),
        migrations.AlterField(
            model_name="materialhistory",
            name="quantity",
            field=models.DecimalField(decimal_places=4, help_text="재고 변동 수량", max_digits=14),
        ),
        migrations.AlterField(
            model_name="materialhistory",
            name="remaining_quantity",
            field=models.DecimalField(blank=True, decimal_places=4, help_text="현재 잔량", max_digits=14, null=True),
        ),
        migrations.AlterField(
            model_name="materialhistory",
            name="total_stock",
            field=models.DecimalField(decimal_places=4, help_text="재고 변동 후 재고", max_digits=14),
        ),
        migrations.AlterField(
            model_name="materialproduct",
            name="quantity",
            field=models.DecimalField(decimal_places=4, help_text="제품 1개 생산에 필요한 원자재 수량", max_digits=14),
        ),
        migrations.AlterField(
            model_name="materialusage",
            name="usage_amount",
            field=models.DecimalField(decimal_places=4, help_text="실제 투입량", max_digits=14),
        ),
    ]
