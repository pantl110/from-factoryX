import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal";
interface MoveToStorageModalProps {
  onClose: () => void;
}

const MoveToStorageModal = ({ onClose }: MoveToStorageModalProps) => {
  return (
    <Modal
      title="프로젝트를 보관하시겠습니까?"
      onClose={onClose}
      width="w-[487px]"
      subtitle="납품 예정된 품목이 완료 처리되며, 프로젝트는 보관함으로 이동됩니다."
      sm={true}
    >
      <div className="flex gap-2.5 mt-4 justify-end">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          hoverColor=""
          onClick={onClose}
        />
        <MiniBtn
          text="보관하기"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          onClick={onClose}
        />
      </div>
    </Modal>
  );
};

export default MoveToStorageModal;
