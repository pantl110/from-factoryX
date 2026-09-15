from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from tax.models import NationalTaxService, PublishStatus


ISSUED_BAROBILL_STATES = {3011, 3021, 3014}
FAILED_BAROBILL_STATES = {4012, 4022, 5013, 5023, 5031}


def is_publish_claim_stale(document) -> bool:
    if document.publish_status != PublishStatus.publishing:
        return False
    if document.last_publish_attempt_at is None:
        return True
    timeout_seconds = settings.TAX_PUBLISH_CLAIM_TIMEOUT_SECONDS
    return document.last_publish_attempt_at <= timezone.now() - timedelta(
        seconds=timeout_seconds
    )


def claim_document_for_publish(document_id):
    """Atomically claim one draft/failed document without a read-write race."""
    claimed = NationalTaxService.objects.filter(
        id=document_id,
        publish_status__in=[PublishStatus.temporary, PublishStatus.failed],
    ).update(
        publish_status=PublishStatus.publishing,
        publish_attempt_count=F("publish_attempt_count") + 1,
        last_publish_attempt_at=timezone.now(),
        last_publish_error="",
    )
    document = NationalTaxService.objects.select_related("factory", "client").get(
        id=document_id
    )
    if claimed:
        return "claimed", document
    if document.publish_status == PublishStatus.published:
        return "skipped", document
    return "blocked", document


@transaction.atomic
def complete_document_publish(document_id):
    document = NationalTaxService.objects.select_for_update().get(id=document_id)
    if document.publish_status != PublishStatus.publishing:
        return document
    document.publish_status = PublishStatus.published
    document.barobill_state = "발급완료"
    document.nts_send_state = "전송전"
    document.last_publish_error = ""
    document.save(
        update_fields=[
            "publish_status",
            "barobill_state",
            "nts_send_state",
            "last_publish_error",
            "updated_at",
        ]
    )
    return document


@transaction.atomic
def fail_document_publish(document_id, message):
    document = NationalTaxService.objects.select_for_update().get(id=document_id)
    if document.publish_status == PublishStatus.publishing:
        document.publish_status = PublishStatus.failed
        document.last_publish_error = message[:2000]
        document.save(
            update_fields=[
                "publish_status",
                "last_publish_error",
                "updated_at",
            ]
        )
    return document


@transaction.atomic
def apply_remote_publish_state(document_id, state_result):
    """Resolve a stale local claim from BaroBill's authoritative state."""
    document = NationalTaxService.objects.select_for_update().get(id=document_id)
    barobill_code = state_result.BarobillState
    nts_code = getattr(state_result, "NTSSendState", None)

    if barobill_code == -21002:
        # The process stopped before BaroBill registered the MgtKey. This is the
        # only stale outcome that is safe to retry as a fresh issue request.
        document.publish_status = PublishStatus.failed
        document.last_publish_error = (
            "바로빌에 발행 기록이 없어 재시도 가능한 상태로 복구했습니다."
        )
    elif barobill_code in ISSUED_BAROBILL_STATES:
        document.publish_status = PublishStatus.published
        document.barobill_state = "발급완료"
        document.nts_send_state = {
            1: "전송전",
            2: "전송대기",
            3: "전송중",
            4: "전송완료",
            5: "전송실패",
        }.get(nts_code, document.nts_send_state)
        document.last_publish_error = ""
    elif barobill_code in FAILED_BAROBILL_STATES or nts_code == 5:
        document.publish_status = PublishStatus.failed
        document.last_publish_error = "바로빌 상태 조회에서 발행 실패가 확인되었습니다."
    else:
        # A remote document exists but is not conclusively issued or failed.
        # Keep it non-retryable to avoid a duplicate issue with the same MgtKey.
        document.publish_status = PublishStatus.processing
        document.last_publish_error = ""

    document.save(
        update_fields=[
            "publish_status",
            "barobill_state",
            "nts_send_state",
            "last_publish_error",
            "updated_at",
        ]
    )
    return document
