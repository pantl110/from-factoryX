from django.db import models
import uuid

# Create your models here.

class Item(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="품목명")
    code = models.CharField(max_length=50, unique=True, help_text="품목코드")
    specification = models.CharField(max_length=100, help_text="규격")
    unit = models.CharField(max_length=20, help_text="단위")
    current_stock = models.PositiveIntegerField(default=0, help_text="현재 재고")
    expiration_date = models.DateField(null=True, blank=True, help_text="유통기한")
    received_date = models.DateField(help_text="입고일자")
    warehouse_location = models.CharField(max_length=100, help_text="창고 위치")
    materials = models.ManyToManyField(
        'material.Material',
        through='ItemMaterial',
        related_name='items',
        blank=True,
        help_text='이 품목(Item)을 만드는데 사용된 자재(Material)들'
    )

    def __str__(self):
        return f"{self.name} ({self.code})"

class ItemMaterial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey('item.Item', on_delete=models.CASCADE)
    material = models.ForeignKey('material.Material', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(help_text='이 품목을 만드는데 필요한 자재 수량')

    class Meta:
        unique_together = ('item', 'material')

    def __str__(self):
        return f"{self.item} - {self.material} : {self.quantity}개"

class Return(models.Model):
    """반품 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='returns',
        help_text="반품된 품목"
    )
    return_quantity = models.PositiveIntegerField(help_text="반품수량")
    return_date = models.DateField(help_text="반품일자")
    
    class Meta:
        verbose_name = "반품"
        verbose_name_plural = "반품"
        ordering = ['-return_date']
    
    def __str__(self):
        return f"{self.item.name} - {self.return_quantity}개 ({self.return_date})"


