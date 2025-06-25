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
      title="저장 후 계속 진행할까요?"
      subtitle={`수정 내용을 저장하고 다음 단계로 진행할까요?
        저장된 정보는 이후 생산 일정과 작업 흐름에 반영돼요.`}
      width="w-[457px]"
      sm={true}
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          onClick={onClose}
          hoverColor=""
        />
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
