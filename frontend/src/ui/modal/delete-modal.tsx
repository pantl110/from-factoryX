import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";

interface DeleteModalProps {
  onClose: () => void;
  onDelete?: () => void;
}

const DeleteModal = ({ onClose, onDelete }: DeleteModalProps) => {
  return (
    <Modal
      title="삭제하시겠습니까?"
      subtitle="이 작업은 되돌릴 수 없습니다. 선택한 항목이 영구적으로 삭제됩니다."
      sm={true}
      onClose={onClose}
    >
      <div className="flex gap-[5px] justify-end mt-4">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          onClick={onClose}
          hoverColor=""
        />
        <MiniBtn
          text="삭제하기"
          textColor="text-red"
          bgColor="bg-red-8"
          onClick={onDelete}
          hoverColor="hover:bg-red-hover"
        />
      </div>
    </Modal>
  );
};

export default DeleteModal;
