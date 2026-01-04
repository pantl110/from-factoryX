import { TransactionType } from '@/types/status-type';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useTranslations } from 'next-intl';

interface ClaimReceiptTaxModalProps {
  onClose: () => void;
  issueType: 'invoice' | 'receipt';
  handleTemporarySave: (transactionType: TransactionType) => Promise<boolean>;
  setIsEditingMode: (isEditingMode: boolean) => void;
}

const ClaimReceiptTaxModal = ({
  onClose,
  issueType,
  handleTemporarySave,
  setIsEditingMode,
}: ClaimReceiptTaxModalProps) => {
  const t = useTranslations('tax.createTaxPanel.claimReceiptTaxModal');
  const tTax = useTranslations('tax');
  const tCommon = useTranslations('common');
  const issueTypeLabel =
    issueType === 'invoice' ? tTax('request') : tTax('receipt');

  const getTitle = () => {
    return t('title', { issueType: issueTypeLabel });
  };

  const getSubtitle = () => {
    return t('subtitle', { issueType: issueTypeLabel });
  };

  return (
    <>
      <Modal title={getTitle()} subtitle={getSubtitle()} onClose={onClose}>
        <div className="flex justify-end gap-[5px] mt-4">
          <MiniBtn
            text={tCommon('cancel')}
            textColor="text-sv"
            hoverColor="hover:bg-bg"
            onClick={onClose}
          />
          <MiniBtn
            text={tCommon('confirm')}
            textColor="text-wh"
            bgColor="bg-primary"
            hoverColor="hover:bg-primary-hover"
            onClick={async () => {
              try {
                const isSuccess = await handleTemporarySave(
                  issueType === 'invoice' ? 'invoice' : 'receipt'
                );
                // 성공했을 때만 편집 모드 해제 및 모달 닫기
                if (isSuccess) {
                  if (setIsEditingMode) {
                    setIsEditingMode(false);
                  }
                  onClose();
                }
              } catch {
                // console.error('임시저장 실패:', error);
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
