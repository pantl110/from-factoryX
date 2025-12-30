import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useRouter } from 'next/navigation';

interface NeedInfoModalProps {
  onClose: () => void;
  onSaveDraft: (isConfirm: boolean) => boolean | Promise<boolean>;
  isOrderStatus: boolean;
}

const NeedInfoModal = ({
  onClose,
  onSaveDraft,
  isOrderStatus,
}: NeedInfoModalProps) => {
  const router = useRouter();

  return (
    <Modal
      title="이메일 전송을 위해 회사 정보가 필요해요"
      subtitle={`내 회사 정보가 등록되어 있지 않아, 견적서의 발신자 정보가 비어 있습니다. 먼저 내 회사 정보를 입력해 주세요.`}
      onClose={onClose}
    >
      <div className="flex justify-end gap-[5px] mt-4">
        <MiniBtn text="닫기" variant="white" onClick={onClose} />
        <MiniBtn
          text="회사 정보 입력하러 가기"
          variant="primary"
          onClick={() => {
            onSaveDraft(isOrderStatus);
            onClose();
            router.push('/setting');
          }}
        />
      </div>
    </Modal>
  );
};

export default NeedInfoModal;
