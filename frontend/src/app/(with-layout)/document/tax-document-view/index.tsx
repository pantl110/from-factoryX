import TaxBuyerProviderInfo from './tax-buyer-provider-info';
import OrderItemInfo from './order-item-info';
import PurchaseItemInfo from './purchase-item-info';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import { TaxDocumentType } from '@/types/status-type';

interface TaxDocumentViewProps {
  taxType?: TaxDocumentType;
  item?: PublishedTaxInvoiceResponseModel;
}

const TaxDocumentView = ({ taxType, item }: TaxDocumentViewProps) => {
  return (
    <div className="flex flex-col gap-6">
      {item && (
        <TaxBuyerProviderInfo
          taxType={taxType || item.tax_invoice_type}
          clientInfo={item.client_info}
          updatedAt={item.updated_at}
          transactionType={item.transaction_type}
        />
      )}
      {taxType === 'sales' ||
        (item?.tax_invoice_type === 'sales' && (
          <OrderItemInfo
            productsInfo={item.products_info}
            taxType={taxType || item.tax_invoice_type}
            transactionAmount={item.transaction_amount}
          />
        ))}
      {item?.tax_invoice_type === 'purchase' && <PurchaseItemInfo />}
    </div>
  );
};

export default TaxDocumentView;
