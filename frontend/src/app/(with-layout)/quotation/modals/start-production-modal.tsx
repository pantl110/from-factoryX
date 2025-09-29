import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface StartProductionModalProps {
  onClose: () => void;
  onClick: () => void;
  isLoading?: boolean;
}

const StartProductionModal = ({
  onClose,
  onClick,
  isLoading = false,
}: StartProductionModalProps) => {
  return (
    <Modal
      onClose={onClose}
      title="이 주문서로 생산을 시작할까요?"
      subtitle={`확정된 주문서가 맞다면 ‘생산 시작’을 눌러주세요.`}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn
          text="취소"
          textColor="text-sv"
          onClick={onClose}
          hoverColor="hover:bg-bg"
        />
        <MiniBtn
          text="생산 시작"
          textColor="text-wh"
          bgColor="bg-primary"
          onClick={onClick}
          hoverColor="hover:bg-primary-hover"
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default StartProductionModal;
