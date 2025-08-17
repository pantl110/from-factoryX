import PriceInfo from '@/ui/price-info';
import OrderTableItem from './order-table-item';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';

import NoHistoryBox from '@/ui/no-history-box';

interface OrderItemInfoProps {
  lineItems: PublishedTaxInvoiceResponseModel['line_items'];
  productsInfo: PublishedTaxInvoiceResponseModel['products_info'];
  transactionAmount: number;
}

const OrderItemInfo = ({
  lineItems,
  productsInfo,
  transactionAmount,
}: OrderItemInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">주문 품목 정보</h3>

      <div className="w-full">
        <div className="flex items-center h-12 w-full border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
          <p className="px-3 flex-2">품목명</p>
          <p className="px-3 flex-2">규격</p>
          <p className="px-3 w-[80px]">단위</p>
          <p className="px-3 flex-1">수량</p>
          <p className="px-3 flex-1">단가</p>
          <p className="px-3 flex-1">공급가액</p>
          <p className="px-3 flex-1">세액</p>
        </div>

        {lineItems.map((lineItem, index) => {
          // TaxLineItemModel.name === TaxProductInfoModel.name && TaxLineItemModel.information === TaxProductInfoModel.spec 조건을 만족하는 productInfo 찾기
          const matchingProductInfo =
            productsInfo?.find(
              (product) =>
                product.name === lineItem.name &&
                product.spec === lineItem.information
            ) || null;

          return (
            <OrderTableItem
              key={index}
              lineItem={lineItem}
              productInfo={matchingProductInfo}
            />
          );
        })}
      </div>

      <PriceInfo supplyAmount={transactionAmount} textColor={'text-primary'} />
    </div>
  );
};

export default OrderItemInfo;
