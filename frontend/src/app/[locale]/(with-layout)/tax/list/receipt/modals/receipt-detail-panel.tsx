import { useTranslations } from 'next-intl';
import InfoLabelValue from '@/ui/info-label-value';
import Panel from '@/ui/panel';
import { useGetCashReceiptDetail } from '@/hooks';
import { useEffect, useState } from 'react';
import { CashReceiptDetailResponseModel } from '@/types/data-model';
import PriceInfo from '@/ui/price-info';
import MiniBtn from '@/ui/mini-btn';
import LinkReceiptModal from './link-receipt-modal';
import useMemberStore from '@/store/member-store';

interface ReceiptDetailPanelProps {
  onClose: () => void;
  itemId: number;
  showPanel?: boolean; // Panel 컴포넌트 사용 여부 (기본값: true)
  showLinkButton?: boolean; // 내역 연결하기 버튼 표시 여부 (기본값: true)
}

const ReceiptDetailPanel = ({
  itemId,
  onClose,
  showPanel = true,
  showLinkButton = true,
}: ReceiptDetailPanelProps) => {
  const t = useTranslations('tax.list.receipt.detailPanel');
  const tCommon = useTranslations('common');
  const tDocumentType = useTranslations('document.type');
  const tList = useTranslations('tax.list');
  const tTax = useTranslations('tax');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  const { getCashReceiptDetail, isLoading, error } = useGetCashReceiptDetail();
  const [cashReceipt, setCashReceipt] =
    useState<CashReceiptDetailResponseModel | null>(null);

  // 모달
  const [isLinkReceiptModalOpen, setIsLinkReceiptModalOpen] = useState(false);

  useEffect(() => {
    getCashReceiptDetail(itemId).then((res) => {
      if (res.success && res.data) {
        setCashReceipt(res.data);
      }
    });
  }, [getCashReceiptDetail, itemId]);
  if (!itemId || itemId === 0) return null;

  const content = (
    <>
      {isLoading || error ? null : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="Heading-3 h-10 items-center flex">
              {t('transactionInfo')}
            </h3>
            <div className="width-full border-b border-lg">
              <InfoLabelValue
                label={t('transactionDate')}
                value={cashReceipt?.transaction_date}
              />
              <InfoLabelValue
                label={t('approvalNumber')}
                value={cashReceipt?.nts_confirm_num}
              />
              <InfoLabelValue
                label={t('tradeType')}
                value={cashReceipt?.trade_type}
              />
              <InfoLabelValue
                label={t('tradeUsage')}
                value={cashReceipt?.trade_usage}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="Heading-3 h-10 items-center flex">
              {tTax('buyerInfo')}
            </h3>
            <div className="width-full border-b border-lg">
              <InfoLabelValue
                label={tCommon('clientName')}
                value={cashReceipt?.client_info.name}
              />
              <InfoLabelValue
                label={tCommon('businessRegistrationNumber')}
                value={cashReceipt?.client_info.business_registration_number}
              />
              <InfoLabelValue
                label={tCommon('representativeName')}
                value={cashReceipt?.client_info.representative_name}
              />
              <InfoLabelValue
                label={tCommon('businessAddress')}
                value={cashReceipt?.client_info.address}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="Heading-3 h-10 items-center flex">
              {tCommon('purchaseMaterialInfo')}
            </h3>
            <PriceInfo
              supplyAmount={cashReceipt?.transaction_amount || 0}
              taxAmount={cashReceipt?.tax_amount || 0}
              textColor={'text-red'}
            />
          </div>
        </div>
      )}
    </>
  );

  if (!showPanel) {
    return (
      <>
        {content}
        {/* material history 연결 모달 */}
        {isLinkReceiptModalOpen && (
          <LinkReceiptModal
            onClose={() => setIsLinkReceiptModalOpen(false)}
            supplyAmount={cashReceipt?.transaction_amount || 0}
            taxAmount={cashReceipt?.tax_amount || 0}
            receiptId={cashReceipt?.id || 0}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Panel
        title={tDocumentType('cashReceipt')}
        onClose={onClose}
        headerButton={
          showLinkButton ? (
            <MiniBtn
              variant="outline"
              text={tList('tableHeader.projectLink.purchase')}
              onClick={() => {
                setIsLinkReceiptModalOpen(true);
              }}
              disabled={isViewer}
            />
          ) : undefined
        }
      >
        {content}
      </Panel>

      {/* material history 연결 모달 */}
      {isLinkReceiptModalOpen && (
        <LinkReceiptModal
          onClose={() => setIsLinkReceiptModalOpen(false)}
          supplyAmount={cashReceipt?.transaction_amount || 0}
          taxAmount={cashReceipt?.tax_amount || 0}
          receiptId={cashReceipt?.id || 0}
        />
      )}
    </>
  );
};

export default ReceiptDetailPanel;
