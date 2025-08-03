import { MaterialHistoryStockResponseModel } from '@/types/data-model';
import MiniBtn from '@/ui/mini-btn';

interface MaterialStockLogItemProps {
  data: MaterialHistoryStockResponseModel;
}

const MaterialStockLogItem = ({ data }: MaterialStockLogItemProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case '출고':
        return 'text-red';
      case '구매':
        return 'text-primary';
      default:
        return 'text-dg';
    }
  };

  const getQuantityDisplay = (status: string, quantity: number) => {
    const sign = status === '출고' ? '-' : '+';
    return `${sign}${quantity.toLocaleString()}`;
  };

  // 날짜를 T 전까지만 표시
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return dateString.split('T')[0];
  };

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1">
      <p className="flex-1 px-3 text-dg">{formatDate(data.date)}</p>
      <p className={`flex-1 px-3 ${getStatusColor(data.type)}`}>
        {data.type === '구매' ? '입고' : '출고'}
      </p>
      <p className={`flex-1 px-3 ${getStatusColor(data.type)}`}>
        {getQuantityDisplay(
          data.type === '구매' ? '입고' : '출고',
          data.quantity
        )}
      </p>
      <p className="flex-1 px-3 text-dg">{data.total_stock.toLocaleString()}</p>
      <p className="flex-1 px-3 text-dg">
        {data.purchase_tax_invoice_id ? (
          '-'
        ) : (
          <MiniBtn
            text="연결 필요"
            textColor="text-dg"
            bgColor="bg-bg"
            hoverColor="hover:bg-lg"
            height="h-8"
          />
        )}
      </p>
      <p className="flex-1 px-3 text-sv">
        {data.cash_receipt_id ? (
          '-'
        ) : (
          <MiniBtn
            text="연결 필요"
            textColor="text-dg"
            bgColor="bg-bg"
            hoverColor="hover:bg-lg"
            height="h-8"
          />
        )}
      </p>

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
