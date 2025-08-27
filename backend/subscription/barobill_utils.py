from barobill.scrap_utils import (
    regist_tax_invoice_scrap,
    stop_tax_invoice_scrap,
    cancel_stop_tax_invoice_scrap,
    re_regist_tax_invoice_scrap,
)
import logging

logger = logging.getLogger(__name__)


async def handle_barobill_scrap_for_subscription(factory, subscription_type, action):
    """
    구독에 따라 바로빌 홈택스 스크랩을 제어하는 함수

    Args:
        factory: Factory 객체
        subscription_type: 구독 유형 ('trial', 'basic', 'partners')
        action: 수행할 동작 ('activate', 'deactivate', 'renew')
    """
    if not factory.business_registration_number:
        logger.warning(
            f"사업자등록번호가 없어 바로빌 스크랩 처리를 건너뜁니다: factory_id={factory.id}"
        )
        return

    # basic, partners 구독에서만 홈택스 스크랩 사용
    if subscription_type not in ["basic", "partners"]:
        logger.info(
            f"구독 유형이 basic/partners가 아니므로 바로빌 스크랩 처리를 건너뜁니다: {subscription_type}"
        )
        return

    try:
        if action == "activate":
            # 구독 활성화 시 스크랩 등록
            await regist_tax_invoice_scrap(factory.business_registration_number)
            logger.info(
                f"바로빌 홈택스 스크랩 등록 성공: factory_id={factory.id}, subscription_type={subscription_type}"
            )

        elif action == "deactivate":
            # 구독 비활성화/취소 시 스크랩 정지
            await stop_tax_invoice_scrap(factory.business_registration_number)
            logger.info(
                f"바로빌 홈택스 스크랩 정지 성공: factory_id={factory.id}, subscription_type={subscription_type}"
            )

        elif action == "renew":
            # 구독 갱신 시 스크랩 재등록 (이미 등록되어 있어도 상태 확인 차원에서)
            await regist_tax_invoice_scrap(factory.business_registration_number)
            logger.info(
                f"바로빌 홈택스 스크랩 갱신 등록 성공: factory_id={factory.id}, subscription_type={subscription_type}"
            )

    except Exception as e:
        logger.error(
            f"바로빌 홈택스 스크랩 {action} 처리 실패: factory_id={factory.id}, subscription_type={subscription_type}, error={str(e)}"
        )
        raise e


def is_barobill_scrap_eligible(subscription_type):
    """
    구독 유형이 바로빌 홈택스 스크랩 사용 가능한지 확인

    Args:
        subscription_type: 구독 유형

    Returns:
        bool: 바로빌 스크랩 사용 가능 여부
    """
    return subscription_type in ["basic", "partners"]
