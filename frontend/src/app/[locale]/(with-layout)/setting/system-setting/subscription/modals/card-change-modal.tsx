import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface CardChangeModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const CardChangeModal = ({ onClose, onConfirm }: CardChangeModalProps) => {
  return (
    <Modal
      title="결제 카드를 변경하시겠어요?"
      subtitle="변경된 카드는 다음 결제부터 자동으로 사용돼요."
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text="취소" variant="white" onClick={onClose} />
        <MiniBtn
          text="결제 카드 변경하기"
          variant="primary"
          onClick={onConfirm}
        />
      </div>
    </Modal>
  );
};

export default CardChangeModal;
