from decimal import Decimal
from ninja.errors import HttpError
from project.models import ProjectPlan
from stock.schemas.outbound import MaterialUsageOut
from stock.models import MaterialHistory, MaterialUsage
from repackaging.models import MaterialRepackaging


def check_plan_permission(plan_id: int, factory_id: int) -> ProjectPlan:
    """Plan 존재 확인 및 공장 권한 검증"""
    try:
        plan = ProjectPlan.objects.select_related("project").get(id=plan_id)
        if not plan.project.quotations.filter(factory_id=factory_id).exists():
            raise HttpError(403, "해당 프로젝트 플랜에 접근할 권한이 없습니다.")
        return plan
    except ProjectPlan.DoesNotExist:
        raise HttpError(404, "해당 프로젝트 플랜을 찾을 수 없습니다.")


def build_material_usage_out(usage: MaterialUsage) -> MaterialUsageOut:
    """MaterialUsage 인스턴스를 MaterialUsageOut으로 변환"""
    lot_number = None
    material_history_id = None
    material_repackaging_id = None

    if usage.material_history:
        lot_number = usage.material_history.lot_number
        material_history_id = usage.material_history.id
    elif usage.material_repackaging:
        lot_number = usage.material_repackaging.lot_number
        material_repackaging_id = usage.material_repackaging.id

    return MaterialUsageOut(
        id=usage.id,
        plan_id=usage.plan_id,
        plan_end_date=usage.plan.end_date if usage.plan else None,
        material_id=usage.material.id,
        material_name=usage.material.name,
        material_unit=usage.material.unit,
        original_material_id=usage.original_material.id if usage.original_material else None,
        original_material_name=usage.original_material.name if usage.original_material else None,
        usage_amount=usage.usage_amount,
        material_history_id=material_history_id,
        material_history_lot_number=lot_number if material_history_id else None,
        material_repackaging_id=material_repackaging_id,
        material_repackaging_lot_number=lot_number if material_repackaging_id else None,
        created_at=usage.created_at,
        updated_at=usage.updated_at,
    )


def restore_lot_allocation(
    history: MaterialHistory | None,
    repackaging: MaterialRepackaging | None,
    amount: Decimal | None,
) -> None:
    """이전 LOT/소분 잔량 복원"""
    if not amount or (history is None and repackaging is None):
        return

    amount = Decimal(amount)
    if history:
        locked_history = MaterialHistory.objects.select_for_update().get(id=history.id)
        locked_history.refresh_from_db(fields=["remaining_quantity"])
        current = locked_history.remaining_quantity or Decimal("0")
        locked_history.remaining_quantity = current + amount
        locked_history.save(update_fields=["remaining_quantity"])
    elif repackaging:
        locked_repackaging = (
            MaterialRepackaging.objects.select_for_update().get(id=repackaging.id)
        )
        locked_repackaging.refresh_from_db(fields=["quantity"])
        current = locked_repackaging.quantity or Decimal("0")
        locked_repackaging.quantity = current + amount
        locked_repackaging.save(update_fields=["quantity"])


def _format_shortage_message(material_name: str | None, lot_number: str | None) -> str:
    material_label = material_name or "알 수 없는 자재"
    lot_label = lot_number or "알 수 없는 LOT"
    return f"자재 '{material_label}' LOT '{lot_label}'의 잔량이 부족합니다."


def apply_lot_allocation(
    history: MaterialHistory | None,
    repackaging: MaterialRepackaging | None,
    amount: Decimal | None,
) -> None:
    """선택한 LOT/소분 잔량 차감"""
    if not amount or (history is None and repackaging is None):
        return

    amount = Decimal(amount)
    if history:
        locked_history = MaterialHistory.objects.select_for_update().get(id=history.id)
        locked_history.refresh_from_db(fields=["remaining_quantity"])
        current = locked_history.remaining_quantity or Decimal("0")
        if current < amount:
            raise HttpError(
                400,
                _format_shortage_message(
                    material_name=getattr(locked_history.material, "name", None),
                    lot_number=locked_history.lot_number,
                ),
            )
        locked_history.remaining_quantity = current - amount
        locked_history.save(update_fields=["remaining_quantity"])
    elif repackaging:
        locked_repackaging = (
            MaterialRepackaging.objects.select_for_update().get(id=repackaging.id)
        )
        locked_repackaging.refresh_from_db(fields=["quantity"])
        current = locked_repackaging.quantity or Decimal("0")
        parent_material = (
            getattr(repackaging.parent_history.material, "name", None)
            if repackaging.parent_history
            else None
        )
        parent_lot = (
            repackaging.parent_history.lot_number
            if repackaging.parent_history
            else None
        )
        if current < amount:
            raise HttpError(
                400,
                _format_shortage_message(
                    material_name=parent_material,
                    lot_number=repackaging.lot_number or parent_lot,
                ),
            )
        locked_repackaging.quantity = current - amount
        locked_repackaging.save(update_fields=["quantity"])


def reallocate_lot_on_update(
    prev_history: MaterialHistory | None,
    prev_repackaging: MaterialRepackaging | None,
    prev_amount: Decimal | None,
    new_history: MaterialHistory | None,
    new_repackaging: MaterialRepackaging | None,
    new_amount: Decimal | None,
) -> None:
    """업데이트 시 LOT/소분 재배분"""
    prev_amount = Decimal(prev_amount or 0)
    new_amount = Decimal(new_amount or 0)

    same_history = (
        prev_history
        and new_history
        and prev_history.id == new_history.id
    )
    same_repackaging = (
        prev_repackaging
        and new_repackaging
        and prev_repackaging.id == new_repackaging.id
    )

    if same_history or same_repackaging:
        delta = new_amount - prev_amount
        if delta > 0:
            apply_lot_allocation(
                new_history if same_history else None,
                new_repackaging if same_repackaging else None,
                delta,
            )
        elif delta < 0:
            restore_lot_allocation(
                new_history if same_history else None,
                new_repackaging if same_repackaging else None,
                abs(delta),
            )
        return

    if prev_history or prev_repackaging:
        restore_lot_allocation(prev_history, prev_repackaging, prev_amount)

    if new_history or new_repackaging:
        apply_lot_allocation(new_history, new_repackaging, new_amount)



