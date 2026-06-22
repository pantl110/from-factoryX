'use client';

import { useTranslations } from 'next-intl';
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
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">
        {tCommon('orderProductInfo')}
      </h3>

      <div className="w-full">
        <div className="flex items-center h-12 w-full border-t border-b border-lg Me_Body-3 text-sv rounded-sm">
          <p className="px-3 flex-[1.6]">{tCommon('productName')}</p>
          <p className="px-3 flex-1">{tCommon('specification')}</p>
          <p className="px-3 flex-1">{tCommon('quantity')}</p>
          <p className="px-3 flex-1">{tCommon('unitPrice')}</p>
          <p className="px-3 flex-1">{tCommon('totalAmount')}</p>
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
