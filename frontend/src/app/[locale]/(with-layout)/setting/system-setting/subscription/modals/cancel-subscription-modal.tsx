'use client';

import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface CancelSubscriptionModalProps {
  planTitle: string;
  onClose: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CancelSubscriptionModal = ({
  planTitle,
  onClose,
  onCancel,
  isLoading,
}: CancelSubscriptionModalProps) => {
  return (
    <Modal
      title={`${planTitle} 플랜을 구독 해지하시겠어요?`}
      subtitle={`해지하면 다음 결제일부터 요금이 청구되지 않고, 
모든 기능 사용이 제한돼요.`}
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text="취소" variant="white" onClick={onClose} />
        <MiniBtn
          text="구독 해지"
          variant="primary"
          onClick={onCancel}
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default CancelSubscriptionModal;
