import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";

interface CardChangeModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const CardChangeModal = ({ onClose, onConfirm }: CardChangeModalProps) => {
  return (
    <Modal
      title="카드를 변경하시겠어요?"
      subtitle="현재 등록된 카드가 아닌 카드를 변경할 경우 기존 카드는 삭제되고\n새로운 카드가 결제카드로 설정됩니다."
      onClose={onClose}
      sm={true}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          onClick={onClose}
          hoverColor=""
        />
        <MiniBtn
          text="결제 카드 변경하기"
          bgColor="bg-primary"
          textColor="text-wh"
          onClick={onConfirm}
          hoverColor="hover:bg-primary-hover"
        />
      </div>
    </Modal>
  );
};

export default CardChangeModal;
