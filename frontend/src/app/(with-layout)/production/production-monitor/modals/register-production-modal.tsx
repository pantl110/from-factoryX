import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface RegisterProductionModalProps {
  onClose: () => void;
}

const RegisterProductionModal = ({ onClose }: RegisterProductionModalProps) => {
  return (
    <Modal
      title="생산 대기열에 등록되었습니다."
      subtitle={`반품된 품목의 추가 생산이 등록되었습니다.\n지금 바로 생산을 시작하시겠어요?`}
      onClose={onClose}
    >
      <div className="m-4 flex justify-end gap-[5px]">
        <MiniBtn
          text="취소하기"
          textColor="text-sv"
          hoverColor=""
          onClick={onClose}
        />
        <MiniBtn
          text="생산 시작"
          hoverColor="hover:bg-primary-hover"
          textColor="text-wh"
          bgColor="bg-primary"
          onClick={onClose}
        />
      </div>
    </Modal>
  );
};

export default RegisterProductionModal;
