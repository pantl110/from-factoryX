import ReceiptDetailPanel from '@/app/(with-layout)/tax/receipt/modals/receipt-detail-panel';
import TaxDetailPanel from '@/app/(with-layout)/tax/tax-detail-panel';
import { MaterialHistoryResponseModel } from '@/types/data-model';
import MiniBtn from '@/ui/mini-btn';
import { useState } from 'react';

interface MaterialStockLogItemProps {
  data: MaterialHistoryResponseModel;
}

const MaterialStockLogItem = ({ data }: MaterialStockLogItemProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'consumption':
        return 'text-red';
      case 'purchase':
        return 'text-primary';
      default:
        return 'text-dg';
    }
  };

  const getQuantityDisplay = (status: string, quantity: number) => {
    const sign = status === 'purchase' ? '+' : '-';
    return `${sign}${quantity.toLocaleString()}`;
  };

  // 날짜를 T 전까지만 표시
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return dateString.split('T')[0];
  };

  const [isTaxDetailPanelOpen, setIsTaxDetailPanelOpen] = useState(false);
  const [isCashReceiptDetailPanelOpen, setIsCashReceiptDetailPanelOpen] =
    useState(false);

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-default">
      <p className="flex-1 px-3 text-dg">{formatDate(data.date)}</p>
      <p className={`flex-1 px-3 ${getStatusColor(data.type)}`}>
        {data.type === 'purchase' ? '입고' : '사용'}
      </p>
      <p className={`flex-1 px-3 ${getStatusColor(data.type)}`}>
        {getQuantityDisplay(data.type, data.quantity)}
      </p>
      <p className="flex-1 px-3 text-dg">{data.total_stock.toLocaleString()}</p>
      <p className="flex-1 px-3 text-dg">
        {data.type === 'purchase' && data.national_tax_service_id ? (
          <MiniBtn
            text="보기"
            textColor="text-dg"
            hoverColor="hover:bg-bg"
            borderColor="border-lg"
            height="h-8"
            onClick={() => {
              setIsTaxDetailPanelOpen(true);
            }}
          />
        ) : (
          '-'
        )}
      </p>
      <p className="flex-1 px-3 text-sv">
        {data.type === 'purchase' && data.cash_receipt ? (
          <MiniBtn
            text="보기"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            height="h-8"
            onClick={() => {
              setIsCashReceiptDetailPanelOpen(true);
            }}
          />
        ) : (
          '-'
        )}
      </p>

      {isTaxDetailPanelOpen && data.national_tax_service_id && (
        <TaxDetailPanel
          itemId={data.national_tax_service_id}
          onClose={() => {
            setIsTaxDetailPanelOpen(false);
          }}
        />
      )}

      {isCashReceiptDetailPanelOpen && data.cash_receipt && (
        <ReceiptDetailPanel
          itemId={data.cash_receipt}
          onClose={() => {
            setIsCashReceiptDetailPanelOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MaterialStockLogItem;
