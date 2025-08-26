import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
interface MoveToStorageModalProps {
  onClose: () => void;
  onMoveToStorage: () => void;
  isLoading?: boolean;
}

const MoveToStorageModal = ({
  onClose,
  onMoveToStorage,
  isLoading = false,
}: MoveToStorageModalProps) => {
  return (
    <Modal
      title="프로젝트를 보관하시겠습니까?"
      onClose={onClose}
      subtitle={`납품 예정인 품목이 모두 완료 처리되며,\n프로젝트는 보관함으로 이동돼요.`}
    >
      <div className="flex gap-2.5 mt-4 justify-end">
        <MiniBtn
          text="닫기"
          textColor="text-sv"
          hoverColor="hover:bg-bg"
          onClick={onClose}
        />
        <MiniBtn
          text="보관함으로 이동"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          onClick={onMoveToStorage}
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default MoveToStorageModal;
