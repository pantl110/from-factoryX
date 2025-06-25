import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal";

interface DeleteMemoModalProps {
  onClose: () => void;
}

const DeleteMemoModal = ({ onClose }: DeleteMemoModalProps) => {
  return (
    <Modal
      title="메모를 삭제하시겠어요?"
      subtitle="삭제하면 해당 메모는 영구적으로 삭제돼요."
      width="w-[420px]"
      sm={true}
      onClose={onClose}
    >
      <div className="flex gap-2.5 justify-end mt-4">
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
          hoverColor="hover:bg-red-hover"
          onClick={onClose}
        />
      </div>
    </Modal>
  );
};

export default DeleteMemoModal;
