from decimal import Decimal, InvalidOperation

from ninja.errors import HttpError

from stock.models import Material
from unit_conversion.models import UnitConversion


async def normalize_material_quantity(
    material: Material,
    quantity: Decimal,
    input_unit: str | None,
) -> Decimal:
    """Convert a BOM quantity to the material's inventory unit."""

    try:
        decimal_quantity = Decimal(str(quantity))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise HttpError(400, "올바른 자재 수량을 입력해주세요.") from exc

    source_unit = (input_unit or material.unit or "").strip()
    target_unit = (material.unit or "").strip()

    if not source_unit or source_unit.casefold() == target_unit.casefold():
        return decimal_quantity

    direct = await UnitConversion.objects.filter(
        factory_id=material.factory_id,
        material_id=material.id,
        from_unit__iexact=source_unit,
        to_unit__iexact=target_unit,
    ).afirst()
    if direct:
        if direct.from_quantity == 0:
            raise HttpError(400, "단위변환 기준 수량은 0일 수 없습니다.")
        return decimal_quantity * direct.to_quantity / direct.from_quantity

    reverse = await UnitConversion.objects.filter(
        factory_id=material.factory_id,
        material_id=material.id,
        from_unit__iexact=target_unit,
        to_unit__iexact=source_unit,
    ).afirst()
    if reverse:
        if reverse.to_quantity == 0:
            raise HttpError(400, "단위변환 기준 수량은 0일 수 없습니다.")
        return decimal_quantity * reverse.from_quantity / reverse.to_quantity

    raise HttpError(
        400,
        f"{source_unit}에서 {target_unit}(으)로 변환하는 단위 정보가 없습니다.",
    )
