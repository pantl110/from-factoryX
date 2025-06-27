import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";

interface DeleteModalProps {
  onClose: () => void;
}

const DeleteModal = ({ onClose }: DeleteModalProps) => {
  return (
    <Modal
      onClose={onClose}
      width="w-[560px]"
      sm={true}
      title="삭제하시겠습니까?"
      subtitle="이 작업은 되돌릴 수 없습니다.선택한 항목이 영구적으로 삭제됩니다."
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn
          text="취소하기"
          onClick={onClose}
          textColor="text-sv"
          hoverColor=""
        />
        <MiniBtn
          text="삭제하기"
          onClick={onClose}
          textColor="text-red"
          hoverColor="hover:bg-red-hover"
          bgColor="bg-red-8"
        />
      </div>
    </Modal>
  );
};

export default DeleteModal;
