from django.db import models
from common.models import BaseModel
from factory.models import Factory, FactoryClient
from stock.utils_lot import generate_lot_number


# Create your models here.
class Material(BaseModel):
    factory = models.ForeignKey(
        Factory, related_name="materials", on_delete=models.CASCADE
    )
    name = models.CharField(
        max_length=100,
        help_text="자재명",
    )
    code = models.CharField(
        max_length=100,
        help_text="자재코드",
    )
    unit = models.CharField(
        max_length=10,
        help_text="단위",
    )
    spec = models.CharField(
        max_length=100,
        help_text="규격",
    )
    current_stock = models.IntegerField(
        default=0,
        null=True,
        help_text="현재 재고",
    )
    standard_stock = models.IntegerField(
        null=True,
        blank=True,
        help_text="안전 재고",
    )
    rop = models.IntegerField(
        null=True,
        blank=True,
        help_text="재주문점 (Reorder Point)",
    )
    max_stock = models.IntegerField(
        null=True,
        blank=True,
        help_text="적정 재고(최대 재고)",
    )
    expiry_days = models.IntegerField(
        default=7,
        null=True,
        blank=True,
        help_text="유통기한 (일)",
    )
    memo = models.TextField(
        null=True,
        blank=True,
        help_text="메모",
    )
    # cost_average = models.PositiveIntegerField(
    #     default=0,
    #     help_text="평균 단가",
    # )
    location = models.ManyToManyField(
        "location.Location",
        related_name="materials",
        blank=True,
        help_text="위치",
    )

    class Meta:
        unique_together = ["factory", "code"]
        ordering = ["-created_at"]


class MaterialHistory(BaseModel):
    class MaterialHistoryType(models.TextChoices):
        purchase = ("purchase", "구매")
        consumption = ("consumption", "소모")

    type = models.CharField(
        max_length=20,
        choices=MaterialHistoryType.choices,
        default=MaterialHistoryType.purchase,
    )
    material = models.ForeignKey(
        Material, related_name="histories", on_delete=models.CASCADE
    )
    client = models.ForeignKey(
        FactoryClient,
        related_name="material_histories",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="고객 (원자재 구매 시에만 입력)",
    )
    quantity = models.IntegerField(
        help_text="재고 변동 수량",
    )
    price = models.IntegerField(
        null=True,
        blank=True,
        help_text="구매 단가 (원자재 구매 시에만 입력)",
    )
    lot_number = models.CharField(
        max_length=100,
        default="",
        blank=True,
        help_text="LOT 번호",
    )
    warehouse_location = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="창고 위치",
    )
    expiration_date = models.DateField(
        null=True,
        blank=True,
        help_text="유통기한",
    )
    remaining_quantity = models.IntegerField(
        null=True,
        blank=True,
        help_text="현재 잔량",
    )
    cash_receipt = models.ForeignKey(
        "tax.CashReceipt",
        related_name="material_histories",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="연결된 현금영수증",
    )
    total_stock = models.IntegerField(
        help_text="재고 변동 후 재고",
    )

    def save(self, *args, **kwargs):
        if not self.lot_number:
            self.lot_number = generate_lot_number()

        # total_stock 자동 계산 (값이 없는 경우)
        if self.total_stock is None:
            current_stock = self.material.current_stock or 0
            if self.type == self.MaterialHistoryType.purchase:
                self.total_stock = current_stock + self.quantity
            else:  # consumption
                self.total_stock = current_stock - self.quantity

        # 구매인 경우에만 cost_average 계산
        # if (
        #     self.type == self.MaterialHistoryType.purchase
        #     and self.price
        #     and self.price > 0
        # ):
        #     try:
        #         # 기존 재고와 새로운 구매를 고려한 평균 단가 계산
        #         current_stock = self.material.current_stock or 0
        #         current_total_value = current_stock * self.material.cost_average
        #         new_total_value = current_total_value + (self.quantity * self.price)
        #         new_total_stock = current_stock + self.quantity
        #
        #         if new_total_stock > 0:
        #             # 반올림을 사용하여 평균 단가 계산
        #             new_cost_average = round(new_total_value / new_total_stock)
        #             self.material.cost_average = new_cost_average
        #             # current_stock도 함께 업데이트
        #             self.material.current_stock = new_total_stock
        #             self.material.save(update_fields=["cost_average", "current_stock"])
        #     except Exception:
        #         # 로그 기록 또는 에러 처리
        #         pass
        # else:
        #     # 구매가 아닌 경우에도 current_stock 업데이트
        #     self.material.current_stock = self.total_stock
        #     self.material.save(update_fields=["current_stock"])
        
        # current_stock 업데이트
        self.material.current_stock = self.total_stock
        self.material.save(update_fields=["current_stock"])

        if self.type == self.MaterialHistoryType.purchase:
            if self.remaining_quantity is None:
                self.remaining_quantity = self.quantity
        else:
            self.remaining_quantity = None

        super().save(*args, **kwargs)


class Product(BaseModel):
    factory = models.ForeignKey(
        Factory, related_name="products", on_delete=models.CASCADE
    )
    name = models.CharField(
        max_length=100,
        help_text="제품명",
    )
    code = models.CharField(
        max_length=100,
        help_text="제품코드",
    )
    unit = models.CharField(
        max_length=10,
        help_text="단위",
    )
    spec = models.CharField(
        max_length=100,
        help_text="규격",
    )
    current_stock = models.IntegerField(
        default=0,
        null=True,
        help_text="현재 재고",
    )
    average_production_time = models.IntegerField(
        null=True,
        blank=True,
        help_text="평균 생산 시간 (초 단위)",
    )
    buffer_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.10,
        help_text="재고 불량률 (기본값: 10%)",
    )
    location = models.ManyToManyField(
        "location.Location",
        related_name="products",
        blank=True,
        help_text="위치",
    )
    note = models.TextField(
        null=True,
        blank=True,
        help_text="특이사항",
    )


class ProductHistory(BaseModel):
    # class ProductHistoryType(models.TextChoices):
    #     IN = ("in", "입고")
    #     OUT = ("out", "출고")

    # type = models.CharField(
    #     max_length=10,
    #     choices=ProductHistoryType.choices,
    #     default=ProductHistoryType.IN,
    # )

    product = models.ForeignKey(
        Product, related_name="histories", on_delete=models.CASCADE
    )
    project_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="해당 history가 발생한 project_id",
    )
    client_name = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="해당 history가 발생한 프로젝트의 거래처명",
    )
    production_quantity = models.IntegerField(
        null=True,
        blank=True,
        help_text="생산 수량",
    )
    delivery_quantity = models.IntegerField(
        null=True,
        blank=True,
        help_text="납품 수량",
    )
    quantity = models.IntegerField(
        help_text="재고 변동 수량 (음수 & 양수), 취소 된 history에 대한 재고 반영",
    )
    total_stock = models.IntegerField(
        help_text="재고 변동 후 재고",
    )
    is_canceled = models.BooleanField(
        default=False,
        help_text="취소 여부",
    )
 


class MaterialProduct(BaseModel):
    product = models.ForeignKey(
        Product, related_name="material_products", on_delete=models.CASCADE
    )
    material = models.ForeignKey(
        Material, related_name="material_products", on_delete=models.CASCADE
    )
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="제품 1개 생산에 필요한 원자재 수량"
    )
