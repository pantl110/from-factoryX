from django.apps import apps


def generate_repackaging_lot_number(parent_lot_number: str) -> str:
    """
    부모 로트 번호를 기반으로 소분 로트 번호를 생성합니다.
    예: LOT-20241121-01 -> LOT-20241121-01-01, LOT-20241121-01-02
    """
    MaterialRepackaging = apps.get_model("repackaging", "MaterialRepackaging")

    # 부모 로트 번호에서 소분된 로트 찾기
    prefix = f"{parent_lot_number}-"
    
    last_repackaging = (
        MaterialRepackaging.objects.filter(lot_number__startswith=prefix)
        .order_by("-lot_number")
        .values_list("lot_number", flat=True)
        .first()
    )

    last_seq = 0
    if last_repackaging:
        try:
            # 부모-XX 형식에서 마지막 숫자 추출
            last_seq = int(last_repackaging.split("-")[-1])
        except (ValueError, IndexError):
            last_seq = 0

    return f"{prefix}{last_seq + 1:02d}"
