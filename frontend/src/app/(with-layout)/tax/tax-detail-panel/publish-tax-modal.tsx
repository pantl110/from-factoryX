import Modal from '@/ui/modal/modal';
import MiniBtn from '@/ui/mini-btn';
import { usePublishTaxInvoice } from '@/hooks';

interface PublishTaxModalProps {
  taxId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const PublishTaxModal = ({
  taxId,
  onClose,
  onSuccess,
}: PublishTaxModalProps) => {
  const { publishTaxInvoice, isLoading } = usePublishTaxInvoice();

  const handlePublish = async () => {
    const result = await publishTaxInvoice(taxId);
    if (result.success) {
      // 성공 후 콜백 실행 (모달 닫기, 판넬 닫기, 토스트 표시)
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <Modal
      title="발행하시겠어요?"
      subtitle={`한 번 발행하면 더 이상 수정이 어려워요.\n해당 문서는 문서함에 보관돼요.`}
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn
          text="취소"
          textColor="text-sv"
          hoverColor="hover:bg-bg"
          onClick={onClose}
        />
        <MiniBtn
          text="확인"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          onClick={handlePublish}
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default PublishTaxModal;
