import { useState, useEffect } from 'react';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';
import useGetTaxInvoiceDetail from '@/hooks/tax/use-get-tax-invoice-detail';
import Spinner from '@/ui/spinner';
import TaxBuyerProviderInfo from './tax-buyer-provider-info';
import OrderItemInfo from './order-item-info';
import PurchaseItemInfo from './purchase-item-info';

interface TaxDocumentViewProps {
  taxId: number | null;
}

const TaxDocumentView = ({ taxId }: TaxDocumentViewProps) => {
  const [item, setItem] = useState<PublishedTaxInvoiceResponseModel | null>(
    null
  );
  const { getTaxInvoiceDetail, isLoading, error } = useGetTaxInvoiceDetail();

  useEffect(() => {
    const fetchTaxInvoice = async () => {
      if (taxId) {
        const result = await getTaxInvoiceDetail(1);
        if (result.success && result.data) {
          setItem(result.data);
        }
      }
    };

    fetchTaxInvoice();
  }, [taxId, getTaxInvoiceDetail]);

  if (isLoading || error || !item) {
    return (
      <div className="flex items-center justify-center h-100">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <TaxBuyerProviderInfo
        taxType={item.tax_invoice_type}
        clientInfo={item.client_info}
        updatedAt={item.updated_at}
        transactionType={item.transaction_type}
      />
      {item.tax_invoice_type === 'sales' && (
        <OrderItemInfo
          lineItems={item.line_items}
          transactionAmount={item.transaction_amount}
          productsInfo={item.products_info}
        />
      )}
      {item.tax_invoice_type === 'purchase' && (
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
