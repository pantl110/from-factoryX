import { TransactionType } from '@/types/status-type';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useTranslations } from 'next-intl';

interface ClaimReceiptTaxModalProps {
  onClose: () => void;
  issueType: 'invoice' | 'receipt';
  onConfirm: (transactionType: TransactionType) => Promise<void>;
}

const ClaimReceiptTaxModal = ({
  onClose,
  issueType,
  onConfirm,
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
          <MiniBtn variant="white"
            text={tCommon('cancel')}
            onClick={onClose}
          />
          <MiniBtn variant="secondary"
            text={tCommon('confirm')}
            onClick={() =>
              onConfirm(issueType === 'invoice' ? 'invoice' : 'receipt')
            }
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
            <MiniBtn variant="secondary"
              text="확인"
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
