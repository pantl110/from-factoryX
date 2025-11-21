from ninja.errors import HttpError
from factory.models import FactoryEquipment
from project.models import ProjectPlan
from stock.models import MaterialProduct
from asgiref.sync import sync_to_async
from decimal import Decimal, ROUND_HALF_UP

async def get_plan_by_id(plan_id):
    try:
        plan = await ProjectPlan.objects.select_related(
            "project", "product__product", "equipment"
        ).aget(id=plan_id)
        return plan
    except ProjectPlan.DoesNotExist:
        raise HttpError(404, "해당 생산 계획을 찾을 수 없습니다.")


async def update_quantity(plan, payload, factory_id):
    """생산 계획 수량 업데이트 메인 함수"""
    if payload.quantity is not None:
        if payload.quantity <= 0:
            raise HttpError(400, "수량은 0보다 커야 합니다.")

        # 기존 수량 저장 및 초기화
        quotation_quantity = plan.product.quantity
        old_quantity = plan.quantity
        new_quantity = payload.quantity

        # 기존 남은 수량 계획 삭제
        await _delete_remaining_plans(plan)

        # 수량에 따른 처리 분기
        if new_quantity < quotation_quantity:
            await _handle_quantity_decrease(
                plan, new_quantity, quotation_quantity, old_quantity, factory_id
            )
        elif new_quantity > quotation_quantity:
            await _handle_quantity_increase(
                plan, new_quantity, quotation_quantity, old_quantity
            )
        else:
            await _handle_quantity_equal(plan, new_quantity, old_quantity)


async def _delete_remaining_plans(plan):
    """현재 계획보다 나중에 생성된 계획들 삭제"""
    await ProjectPlan.objects.filter(
        project=plan.project,
        product=plan.product,
        id__gt=plan.id,
    ).adelete()


async def _handle_quantity_decrease(
    plan, new_quantity, quotation_quantity, old_quantity, factory_id
):
    """수량 감소 처리: 첫 번째 계획 + 두 번째 계획 (buffer rate 적용)"""
    # 첫 번째 계획 업데이트
    plan.quantity = new_quantity
    await _adjust_material_stock(plan.product.product, new_quantity - old_quantity)

    # 두 번째 계획 생성 (buffer rate 적용)
    buffer_quantity = await _calculate_buffer_quantity(
        plan.product.product, quotation_quantity - new_quantity
    )

    alternative_equipment = await _find_alternative_equipment(
        factory_id, plan.equipment.id
    )
    equipment_to_use = alternative_equipment or plan.equipment

    await ProjectPlan.objects.acreate(
        project=plan.project,
        product=plan.product,
        quantity=buffer_quantity,
        equipment=equipment_to_use,
        start_date=plan.start_date,
        end_date=plan.end_date,
        avg_production_time=plan.avg_production_time,
    )


async def _handle_quantity_increase(
    plan, new_quantity, quotation_quantity, old_quantity
):
    """수량 증가 처리: buffer rate 업데이트"""
    # Buffer rate 계산 및 업데이트
    new_buffer_rate = Decimal(new_quantity - quotation_quantity) / Decimal(quotation_quantity)
    # 소수점 2자리로 반올림
    new_buffer_rate = new_buffer_rate.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    product_obj = plan.product.product
    product_obj.buffer_rate = new_buffer_rate
    await sync_to_async(product_obj.save)()

    # 계획 수량 업데이트
    plan.quantity = new_quantity
    await _adjust_material_stock(product_obj, new_quantity - old_quantity)


async def _handle_quantity_equal(plan, new_quantity, old_quantity):
    """수량 동일 처리: Buffer rate 유지"""
    plan.quantity = new_quantity
    await _adjust_material_stock(plan.product.product, new_quantity - old_quantity)


async def _adjust_material_stock(product_obj, quantity_difference):
    """원자재 재고 조정 (공통 로직)"""
    if quantity_difference == 0:
        return

    material_products = await sync_to_async(list)(
        MaterialProduct.objects.select_related("material").filter(product=product_obj)
    )

    for material_product in material_products:
        consumption_difference = quantity_difference * float(material_product.quantity)
        await _update_material_stock(material_product.material, consumption_difference)


async def _update_material_stock(material, consumption_difference):
    """개별 원자재 재고 업데이트"""
    current_stock = material.current_stock

    if consumption_difference > 0:
        # 수량 증가: 재고 감소
        if current_stock >= consumption_difference:
            material.current_stock = current_stock - consumption_difference
            await material.asave()
        else:
            raise HttpError(
                400,
                f"원자재 '{material.name}'의 재고가 부족합니다. "
                f"필요: {consumption_difference}개, 현재: {current_stock}개",
            )
    else:
        # 수량 감소: 재고 증가 (반환)
        material.current_stock = current_stock + abs(consumption_difference)
        await material.asave()


async def _calculate_buffer_quantity(product_obj, shortage_quantity):
    """Buffer rate가 적용된 수량 계산"""
    buffer_rate = float(product_obj.buffer_rate)
    return int(shortage_quantity * (1 + buffer_rate))


async def _find_alternative_equipment(factory_id, current_equipment_id):
    """대체 설비 찾기"""
    return (
        await FactoryEquipment.objects.filter(factory_id=int(factory_id))
        .exclude(id=current_equipment_id)
        .order_by("priority")
        .afirst()
    )
