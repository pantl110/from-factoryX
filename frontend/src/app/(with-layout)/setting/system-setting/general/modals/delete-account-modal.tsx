import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface DeleteAccountModalProps {
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DeleteAccountModal = ({
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteAccountModalProps) => {
  return (
    <Modal
      title="계정을 정말 삭제하시겠어요?"
      subtitle="계정을 삭제하면 모든 정보가 사라지며, 복구할 수 없습니다."
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn
          text="취소"
          textColor="text-sv"
          onClick={onClose}
          hoverColor="hover:bg-bg"
        />
        <MiniBtn
          text="삭제"
          bgColor="bg-red-8"
          textColor="text-red"
          onClick={onConfirm}
          hoverColor="hover:bg-red-hover"
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default DeleteAccountModal;
