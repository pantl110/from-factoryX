import { TransactionType } from '@/types/status-type';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface ClaimReceiptTaxModalProps {
  onClose: () => void;
  issueType: '청구' | '영수';
  handleTemporarySave: (transactionType: TransactionType) => Promise<void>;
  setIsEditingMode: (isEditingMode: boolean) => void;
}

const ClaimReceiptTaxModal = ({
  onClose,
  issueType,
  handleTemporarySave,
  setIsEditingMode,
}: ClaimReceiptTaxModalProps) => {
  // const [isNextModalOpen, setIsNextModalOpen] = useState(false);
  // const [isSubmitting, setIsSubmitting] = useState(false);

  const getTitle = () => {
    return `${issueType} 방식으로 세금계산서를 생성할까요?`;
  };

  const getSubtitle = () => {
    return `${issueType} 방식으로 발행된 세금계산서는 문서 뷰에 '${issueType}'로 표시돼요.`;
  };

  return (
    <>
      <Modal title={getTitle()} subtitle={getSubtitle()} onClose={onClose}>
        <div className="flex justify-end gap-[5px] mt-4">
          <MiniBtn
            text="취소"
            textColor="text-sv"
            hoverColor=""
            onClick={onClose}
          />
          <MiniBtn
            text="확인"
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
            onClick={async () => {
              try {
                await handleTemporarySave(
                  issueType === '청구' ? 'invoice' : 'receipt'
                );
                // 편집 모드 해제 (판넬이 읽기 모드로 바뀜)
                if (setIsEditingMode) {
                  setIsEditingMode(false);
                }
                onClose();
              } catch (error) {
                console.error('임시저장 실패:', error);
              }
            }}
          />
        </div>
      </Modal>

      {/* 다음 모달 */}
      {/* {isNextModalOpen && (
        <Modal
          title="세금계산서가 선택한 방식으로 생성되었어요."
          subtitle="생성된 세금계산서는 문서 형식으로 확인하실 수 있어요."
          onClose={() => setIsNextModalOpen(false)}
        >
          <div className="flex justify-end gap-[5px] mt-4">
            <MiniBtn
              text="취소"
              textColor="text-sv"
              hoverColor=""
              onClick={() => setIsNextModalOpen(false)}
            />
            <MiniBtn
              text="확인"
              textColor="text-wh"
              bgColor="bg-primary"
              hoverColor="hover:bg-primary-hover"
              onClick={() => {
                setIsNextModalOpen(false);
                onClose(); // 모든 모달 닫기
              }}
            />
          </div>
        </Modal>
      )} */}
    </>
  );
};

export default ClaimReceiptTaxModal;
