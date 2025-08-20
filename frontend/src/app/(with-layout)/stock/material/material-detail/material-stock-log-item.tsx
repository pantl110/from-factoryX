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
      case '출고':
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
    <div className="flex items-center h-14 border-b border-lg Me_Body-1">
      <p className="flex-1 px-3 text-dg">{formatDate(data.date)}</p>
      <p className={`flex-1 px-3 ${getStatusColor(data.type)}`}>
        {data.type === 'purchase' ? '입고' : '사용'}
      </p>
      <p className={`flex-1 px-3 ${getStatusColor(data.type)}`}>
        {getQuantityDisplay(data.type, data.quantity)}
      </p>
      <p className="flex-1 px-3 text-dg">{data.total_stock.toLocaleString()}</p>
      <p className="flex-1 px-3 text-dg">
        {data.type === 'purchase' ? (
          data.purchase_tax_invoice_id ? (
            <MiniBtn
              text="연결 완료"
              textColor="text-dg"
              bgColor="bg-wh"
              hoverColor="hover:bg-bg"
              height="h-8"
              onClick={() => {
                setIsTaxDetailPanelOpen(true);
              }}
            />
          ) : (
            <MiniBtn
              text="연결 필요"
              textColor="text-dg"
              bgColor="bg-bg"
              hoverColor="hover:bg-lg"
              height="h-8"
            />
          )
        ) : (
          '-'
        )}
      </p>
      <p className="flex-1 px-3 text-sv">
        {data.type === 'purchase' ? (
          data.cash_receipt_id ? (
            <MiniBtn
              text="연결 완료"
              textColor="text-dg"
              bgColor="bg-wh"
              hoverColor="hover:bg-bg"
              height="h-8"
              onClick={() => {
                setIsCashReceiptDetailPanelOpen(true);
              }}
            />
          ) : (
            <MiniBtn
              text="연결 필요"
              textColor="text-dg"
              bgColor="bg-bg"
              hoverColor="hover:bg-lg"
              height="h-8"
            />
          )
        ) : (
          '-'
        )}
      </p>

      {isTaxDetailPanelOpen && data.purchase_tax_invoice_id && (
        <TaxDetailPanel
          itemId={data.purchase_tax_invoice_id}
          onClose={() => {
            setIsTaxDetailPanelOpen(false);
          }}
        />
      )}

      {isCashReceiptDetailPanelOpen && data.cash_receipt_id && (
        <ReceiptDetailPanel
          itemId={data.cash_receipt_id}
          onClose={() => {
            setIsCashReceiptDetailPanelOpen(false);
          }}
        />
      )}

      {/* <p className="w-[150px] px-3 text-dg">{date}</p>
      <p className={`w-[150px] px-3 ${getStatusColor(status)}`}>{status}</p>
      <p className={`flex-1 px-3 ${getStatusColor(status)}`}>
        {getQuantityDisplay(status, quantity)}
      </p>
      <p className="flex-1 px-3 text-dg">{productName}</p>
      <p className="flex-1 px-3 text-dg">{currentStock.toLocaleString()}</p> */}
    </div>
  );
};

export default MaterialStockLogItem;
