import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useToast } from '@/hooks';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';
import useRegisterProductionFromRefund from '@/hooks/project/project-refund/use-register-production-from-refund';

interface RegisterProductionModalProps {
  onClose: () => void;
  onSuccess?: () => void; // 생산 시작 성공 시 콜백
  logId: number;
  currentAmount: number | null;
  currentProductionAmount: number | null;
  currentRefundDate: string;
}

const RegisterProductionModal = ({
  onClose,
  onSuccess,
  logId,
  currentAmount,
  currentProductionAmount,
  currentRefundDate,
}: RegisterProductionModalProps) => {
  const t = useTranslations('production.registerProductionModal');
  const tCommon = useTranslations('common');
  const { registerProduction, isLoading, error } =
    useRegisterProductionFromRefund();
  // const { updateRefund, isLoading, error } = useUpdateRefund();
  const { isToastOpen, isVisible, showToast } = useToast();

  const handleRegisterProduction = async () => {
    // 유효성 검사: 버튼이 활성화된 상태에서만 호출되므로 값이 있어야 함
    if (currentAmount === null || currentProductionAmount === null) {
      return;
    }

    const result = await registerProduction(logId, {
      amount: currentAmount,
      production_amount: currentProductionAmount,
      refund_date: currentRefundDate,
    });

    if (result.success) {
      onClose();
      onSuccess?.(); // 생산 시작 성공 시 콜백 호출
    } else {
      showToast();
    }
  };

  // 원자재 부족 에러인지 확인 (한국어/영어 모두 확인)
  const isMaterialShortageError =
    error &&
    ((error.includes('원자재') && error.includes('재고가 부족합니다')) ||
      (error.includes('material') && error.includes('shortage')));

  // 원자재 부족 에러 메시지에서 앞부분만 추출 (. 이전)
  const getMaterialShortageMessage = (errorMsg: string) => {
    const dotIndex = errorMsg.indexOf('.');
    return dotIndex > 0 ? errorMsg.substring(0, dotIndex) : errorMsg;
  };

  return (
    <>
      <Modal
        title={t('title')}
        subtitle={t('subtitle')}
        onClose={isLoading ? () => {} : onClose} // 로딩 중에는 창 닫기 비활성화
      >
        <div className="flex justify-end gap-[5px]">
          <MiniBtn
            text={tCommon('cancel')}
            textColor="text-sv"
            hoverColor="hover:bg-bg"
            onClick={onClose}
          />
          <MiniBtn
            text={t('startButton')}
            hoverColor="hover:bg-primary-hover"
            textColor="text-wh"
            bgColor="bg-primary"
            onClick={handleRegisterProduction}
            disabled={isLoading}
          />
        </div>
      </Modal>

      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text={
            isMaterialShortageError
              ? getMaterialShortageMessage(error + '.')
              : t('error.registerFailed')
          }
          subtext={
            isMaterialShortageError
              ? t('error.materialShortage')
              : t('error.retry')
          }
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default RegisterProductionModal;
