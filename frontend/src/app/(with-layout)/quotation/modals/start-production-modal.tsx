import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface StartProductionModalProps {
  onClose?: () => void;
  onClick?: () => void;
}

const StartProductionModal = ({
  onClose,
  onClick,
}: StartProductionModalProps) => {
  return (
    <Modal
      onClose={onClose}
      title="이 주문서로 생산을 시작할까요?"
      subtitle={`확정된 주문서가 맞다면 ‘생산 시작’을 눌러주세요.`}
      sm={true}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn
          text="취소"
          textColor="text-sv"
          onClick={onClose}
          hoverColor=""
        />
        <MiniBtn
          text="생산 시작"
          textColor="text-wh"
          bgColor="bg-primary"
          onClick={onClick}
          hoverColor="hover:bg-primary-hover"
        />
      </div>
    </Modal>
  );
};

export default StartProductionModal;
