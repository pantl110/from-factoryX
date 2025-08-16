import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useToast, useUpdateRefund } from '@/hooks';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';

interface RegisterProductionModalProps {
  onClose: () => void;
  refundId: number;
  refundData: {
    refund_date: string;
    amount: number;
    production_amount: number;
    current_stock: number;
  };
  productId: number;
  logId: number;
}

const RegisterProductionModal = ({
  onClose,
  refundId,
  refundData,
  productId,
  logId,
}: RegisterProductionModalProps) => {
  // const { registerProduction, isLoading, error } =
  //   useRegisterProductionFromRefund();
  const { updateRefund, isLoading, error } = useUpdateRefund();
  const { isToastOpen, isVisible, showToast } = useToast();

  const handleRegisterProduction = async () => {
    // const result = await registerProduction(logId);
    const result = await updateRefund(refundId, {
      refund_date: refundData.refund_date,
      current_stock: refundData.current_stock,
      production_amount: refundData.production_amount,
      product_id: productId,
    });

    if (result.success) {
      if (result.data) {
        console.log('반품 생산 등록 성공:', {
          updated_project_plans: result.data.updated_project_plans,
          deleted_project_plans: result.data.deleted_project_plans,
          created_project_plans: result.data.created_project_plans,
        });
      }
      onClose();
    } else {
      showToast();
    }
  };

  // 원자재 부족 에러인지 확인
  const isMaterialShortageError =
    error && error.includes('원자재') && error.includes('재고가 부족합니다');

  // 원자재 부족 에러 메시지에서 앞부분만 추출 (. 이전)
  const getMaterialShortageMessage = (errorMsg: string) => {
    const dotIndex = errorMsg.indexOf('.');
    return dotIndex > 0 ? errorMsg.substring(0, dotIndex) : errorMsg;
  };

  return (
    <>
      <Modal
        title="생산 대기열에 등록되었습니다."
        subtitle={`반품된 품목의 추가 생산이 등록되었습니다.\n지금 바로 생산을 시작하시겠어요?`}
        onClose={isLoading ? undefined : onClose} // 로딩 중에는 창 닫기 비활성화
      >
        <div className="flex justify-end gap-[5px]">
          <MiniBtn
            text="취소"
            textColor="text-sv"
            hoverColor=""
            onClick={onClose}
            disabled={isLoading}
          />
          <MiniBtn
            text="생산 시작"
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
              : '생산 등록에 오류가 발생했어요.'
          }
          subtext={
            isMaterialShortageError
              ? '원자재를 먼저 등록해주세요.'
              : '잠시 후 다시 시도해 주세요.'
          }
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default RegisterProductionModal;
