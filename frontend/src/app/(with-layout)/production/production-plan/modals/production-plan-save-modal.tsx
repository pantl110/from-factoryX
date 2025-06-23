import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal";

interface ProductionPlanSaveModalProps {
  onClose: () => void;
  onSave: () => void;
}

const ProductionPlanSaveModal = ({
  onClose,
  onSave,
}: ProductionPlanSaveModalProps) => {
  return (
    <Modal
      title="저장하시겠습니까?"
      subtitle="수정한 정보는 저장되며, 이후 생산 일정과 작업 흐름에 적용돼요."
      width="w-[457px]"
      sm={true}
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text="취소하기" textColor="text-sv" onClick={onClose} />
        <MiniBtn
          text="저장하기"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          onClick={onSave}
        />
      </div>
    </Modal>
  );
};

export default ProductionPlanSaveModal;
