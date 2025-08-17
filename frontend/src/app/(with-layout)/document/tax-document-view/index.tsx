import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import { TaxDocumentType } from '@/types/status-type';
import TaxBuyerProviderInfo from './tax-buyer-provider-info';
import OrderItemInfo from './order-item-info';
import PurchaseItemInfo from './purchase-item-info';

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
      {item && (taxType === 'sales' || item.tax_invoice_type === 'sales') && (
        <OrderItemInfo
          lineItems={item.line_items}
          transactionAmount={item.transaction_amount}
          productsInfo={item.products_info}
        />
      )}
      {item &&
        (taxType === 'purchase' || item.tax_invoice_type === 'purchase') && (
          <PurchaseItemInfo
            lineItems={item.line_items}
            transactionAmount={item.transaction_amount}
            productsInfo={item.products_info}
          />
        )}
    </div>
  );
};

export default TaxDocumentView;
