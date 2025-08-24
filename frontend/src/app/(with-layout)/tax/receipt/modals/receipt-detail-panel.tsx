import InfoLabelValue from '@/ui/info-label-value';
import Panel from '@/ui/panel';
import { useGetCashReceiptDetail } from '@/hooks';
import { useEffect, useState } from 'react';
import {
  CashReceiptDetailResponseModel,
  TaxProductInfoModel,
  TaxLineItemModel,
} from '@/types/data-model';
import Spinner from '@/ui/spinner';
import PurchaseItemInfo from '@/app/(with-layout)/document/tax-document-view/purchase-item-info';

interface ReceiptDetailPanelProps {
  onClose: () => void;
  itemId: number;
}

const ReceiptDetailPanel = ({ onClose, itemId }: ReceiptDetailPanelProps) => {
  const { getCashReceiptDetail, isLoading, error } = useGetCashReceiptDetail();
  const [cashReceipt, setCashReceipt] =
    useState<CashReceiptDetailResponseModel | null>(null);

  // TaxProductInfoModel을 TaxLineItemModel[]로 변환하는 함수
  const convertToTaxLineItems = (
    productsInfo: TaxProductInfoModel | null
  ): TaxLineItemModel[] => {
    if (!productsInfo) return [];

    return [
      {
        purchase_expiry: cashReceipt?.transaction_date?.replace(/-/g, '') || '', // YYYYMMDD 형식으로 변환 / 거래일자
        name: productsInfo.name || '', // 품목명
        information: productsInfo.spec || '', // 규격
        chargeable_unit: '1', // ‼️‼️‼️‼️수량
        unit_price: '0', // ‼️‼️‼️‼️단가
        amount: (cashReceipt?.transaction_amount || 0).toString(), // ‼️‼️‼️‼️공급가액
        tax: (cashReceipt?.tax_amount || 0).toString(), // ‼️‼️‼️‼️세액
      },
    ];
  };

  useEffect(() => {
    getCashReceiptDetail(itemId).then((res) => {
      if (res.success && res.data) {
        setCashReceipt(res.data);
      }
    });
  }, [getCashReceiptDetail, itemId]);
  if (!itemId || itemId === 0) return null;

  return (
    <Panel title="현금영수증" onClose={onClose}>
      {isLoading || error ? (
        <div className="flex justify-center items-center h-100">
          <Spinner />
        </div>
      ) : (
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
              <h3 className="Heading-3 h-10 items-center flex">구매처 정보</h3>
              <div>
                <InfoLabelValue
                  label="업체명"
                  value={cashReceipt?.client_info.name}
                />
                <InfoLabelValue
                  label="사업자등록번호"
                  value={cashReceipt?.client_info.business_registration_number}
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

            <PurchaseItemInfo
              lineItems={convertToTaxLineItems(
                cashReceipt?.products_info || null
              )}
              transactionAmount={cashReceipt?.transaction_amount || 0}
              canLink={true}
              setIsLinkModalOpen={() => {}}
              setSelectedLineItem={() => {}}
            />

            {/* <div className="flex flex-col gap-3">
            <h3 className="Heading-3 h-10 items-center flex">구매 자재 정보</h3>
            <div>
              <InfoLabelValue label="거래일자" value={item.date} />
              <InfoLabelValue label="승인번호" value="123456789" />
              <InfoLabelValue label="거래구분" value="승인거래" />
              <InfoLabelValue label="거래용도" value="소득공제" />
            </div>
          </div> */}
          </div>
        </>
      )}
    </Panel>
  );
};

export default ReceiptDetailPanel;
