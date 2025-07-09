import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";

interface StartProductionModalProps {
  onClose?: () => void;
}

const StartProductionModal = ({ onClose }: StartProductionModalProps) => {
  return (
    <Modal
      onClose={onClose}
      title="생산을 시작하겠습니까?"
      subtitle={`해당 작업을 진행하면 프로젝트 상태가 '생산 대기'로 변경돼요.\n생산을 시작하시려면 아래 버튼을 눌러주세요.`}
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
          text="생산 시작"
          textColor="text-wh"
          bgColor="bg-primary"
          onClick={onClose}
          hoverColor="hover:bg-primary-hover"
        />
      </div>
    </Modal>
  );
};

export default StartProductionModal;
