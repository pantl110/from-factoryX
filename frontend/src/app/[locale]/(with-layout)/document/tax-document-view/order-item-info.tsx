import PriceInfo from '@/ui/price-info';
import OrderTableItem from './order-table-item';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';

interface OrderItemInfoProps {
  lineItems: PublishedTaxInvoiceResponseModel['line_items'];
  transactionAmount: number;
  taxAmount: number;
}

const OrderItemInfo = ({
  lineItems,
  transactionAmount,
  taxAmount,
}: OrderItemInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">주문 제품 정보</h3>

      <div className="w-full">
        <div className="flex items-center h-12 w-full border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
          <p className="px-3 flex-2">제품명</p>
          <p className="px-3 flex-2">규격</p>
          <p className="px-3 flex-1">수량</p>
          <p className="px-3 flex-1">단가</p>
          <p className="px-3 flex-1">합계금액</p>
        </div>

        {lineItems.map((lineItem, index) => (
          <OrderTableItem key={index} lineItem={lineItem} />
        ))}
      </div>

      <PriceInfo
        supplyAmount={transactionAmount}
        taxAmount={taxAmount}
        textColor={'text-primary'}
      />
    </div>
  );
};

export default OrderItemInfo;
