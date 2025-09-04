import InfoLabelValue from '@/ui/info-label-value';
import Panel from '@/ui/panel';
import { useGetCashReceiptDetail } from '@/hooks';
import { useEffect, useState } from 'react';
import { CashReceiptDetailResponseModel } from '@/types/data-model';
import Spinner from '@/ui/spinner';
import PriceInfo from '@/ui/price-info';
import MiniBtn from '@/ui/mini-btn';
import LinkReceiptModal from './link-receipt-modal';

interface ReceiptDetailPanelProps {
  onClose: () => void;
  itemId: number;
}

const ReceiptDetailPanel = ({ onClose, itemId }: ReceiptDetailPanelProps) => {
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

  return (
    <>
      <Panel
        title="현금영수증"
        onClose={onClose}
        headerButton={
          <MiniBtn
            text="내역 연결"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={() => {
              setIsLinkReceiptModalOpen(true);
            }}
            disabled={false}
          />
        }
      >
        {isLoading || error ? null : (
          <>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h3 className="Heading-3 h-10 items-center flex">거래 정보</h3>
                <div>
                  <InfoLabelValue
                    label="거래일자"
                    value={cashReceipt?.transaction_date}
                  />
                  <InfoLabelValue
                    label="승인번호"
                    value={cashReceipt?.nts_confirm_num}
                  />
                  <InfoLabelValue
                    label="거래구분"
                    value={cashReceipt?.trade_type}
                  />
                  <InfoLabelValue
                    label="거래용도"
                    value={cashReceipt?.trade_usage}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="Heading-3 h-10 items-center flex">
                  구매처 정보
                </h3>
                <div>
                  <InfoLabelValue
                    label="업체명"
                    value={cashReceipt?.client_info.name}
                  />
                  <InfoLabelValue
                    label="사업자등록번호"
                    value={
                      cashReceipt?.client_info.business_registration_number
                    }
                  />
                  <InfoLabelValue
                    label="대표자명"
                    value={cashReceipt?.client_info.representative_name}
                  />
                  <InfoLabelValue
                    label="사업장 주소"
                    value={cashReceipt?.client_info.address}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="Heading-3 h-10 items-center flex">
                  구매 자재 정보
                </h3>
                <PriceInfo
                  supplyAmount={cashReceipt?.transaction_amount || 0}
                  textColor={'text-red'}
                />
              </div>
            </div>

            {/* line items 없음 */}
            {/* <PurchaseItemInfo
              lineItems={[]}
              transactionAmount={cashReceipt?.transaction_amount || 0}
              canLink={true}
              setIsLinkModalOpen={() => {}}
              setSelectedLineItem={() => {}}
            /> */}
          </>
        )}
      </Panel>

      {/* material history 연결 모달 */}
      {isLinkReceiptModalOpen && (
        <LinkReceiptModal
          onClose={() => setIsLinkReceiptModalOpen(false)}
          supplyAmount={cashReceipt?.transaction_amount || 0}
        />
      )}
    </>
  );
};

export default ReceiptDetailPanel;
