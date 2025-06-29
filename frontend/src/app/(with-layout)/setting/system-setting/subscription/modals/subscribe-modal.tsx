import MiniBtn from "@/ui/mini-btn";
import Modal from "@/ui/modal/modal";

interface SubscribeModalProps {
  onClose: () => void;
}

const SubscribeModal = ({ onClose }: SubscribeModalProps) => {
  return (
    <Modal
      title="지금 변경하시겠어요?"
      subtitle={`현재 무료 체험 기간이 8일 남아있습니다.\n결제 카드를 미리 등록해두시면, 체험 종료 후 자동으로 전환됩니다.`}
      onClose={onClose}
      width="w-[520px]"
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
          text="결제 카드 등록하기"
          bgColor="bg-primary"
          textColor="text-wh"
          onClick={onClose}
          hoverColor="hover:bg-primary-hover"
        />
      </div>
    </Modal>
  );
};

export default SubscribeModal;
