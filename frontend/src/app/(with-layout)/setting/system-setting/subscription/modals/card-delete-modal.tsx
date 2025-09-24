import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface CardDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const CardDeleteModal = ({ onClose, onConfirm }: CardDeleteModalProps) => {
  return (
    <Modal
      title="이 카드를 삭제하시겠어요?"
      subtitle={`삭제하면 앞으로 이 카드로 결제할 수 없어요.\n다시 사용하려면 등록이 필요해요.`}
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text="취소" variant="white" onClick={onClose} />
        <MiniBtn text="삭제" variant="red" onClick={onConfirm} />
      </div>
    </Modal>
  );
};

export default CardDeleteModal;
