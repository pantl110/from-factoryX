import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface CardDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const CardDeleteModal = ({ onClose, onConfirm }: CardDeleteModalProps) => {
  return (
    <Modal
      title="카드를 삭제하시겠어요?"
      subtitle="삭제된 카드는 복구할 수 없어요."
      onClose={onClose}
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
          text="삭제"
          bgColor="bg-red-8"
          textColor="text-red"
          onClick={onConfirm}
          hoverColor="hover:bg-red-hover"
        />
      </div>
    </Modal>
  );
};

export default CardDeleteModal;
