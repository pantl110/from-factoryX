from django.apps import apps
from django.utils import timezone


def generate_lot_number() -> str:
    """LOT-YYYYMMDD-XX 형식의 LOT 번호를 생성합니다."""
    MaterialHistory = apps.get_model("stock", "MaterialHistory")

    today_str = timezone.localdate().strftime("%Y%m%d")
    prefix = f"LOT-{today_str}-"

    last_lot = (
        MaterialHistory.objects.filter(lot_number__startswith=prefix)
        .order_by("-lot_number")
        .values_list("lot_number", flat=True)
        .first()
    )

    last_seq = 0
    if last_lot:
        try:
            last_seq = int(last_lot.split("-")[-1])
        except (ValueError, IndexError):
            last_seq = 0

    return f"{prefix}{last_seq + 1:02d}"

