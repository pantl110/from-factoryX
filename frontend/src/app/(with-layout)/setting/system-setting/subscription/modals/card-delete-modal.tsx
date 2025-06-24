import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal";

interface CardDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const CardDeleteModal = ({ onClose, onConfirm }: CardDeleteModalProps) => {
  return (
    <Modal
      title="카드를 정말 삭제하시겠어요?"
      subtitle="카드를 삭제하면 모든 정보가 사라지며, 복구할 수 없습니다."
      onClose={onClose}
      width="w-[420px]"
      sm={true}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text="취소하기" textColor="text-sv" onClick={onClose} />
        <MiniBtn
          text="삭제하기"
          bgColor="bg-red-8"
          textColor="text-red"
          onClick={onConfirm}
        />
      </div>
    </Modal>
  );
};

export default CardDeleteModal;
