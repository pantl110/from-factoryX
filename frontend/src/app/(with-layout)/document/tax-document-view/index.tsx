import { useState, useEffect } from 'react';
import {
  PublishedTaxInvoiceResponseModel,
  TaxLineItemModel,
} from '@/types/data-model';
import Spinner from '@/ui/spinner';
import TaxBuyerProviderInfo from './tax-buyer-provider-info';
import OrderItemInfo from './order-item-info';
import PurchaseItemInfo from './purchase-item-info';
import { useGetTaxInvoiceDetail } from '@/hooks';
import DocInfo from './doc-info';

interface TaxDocumentViewProps {
  taxId?: number | null;
  item?: PublishedTaxInvoiceResponseModel | null;
  canLink?: boolean;
  setIsLinkModalOpen?: (isOpen: boolean) => void;
  setSelectedLineItem?: (lineItem: TaxLineItemModel | null) => void;
}

const TaxDocumentView = ({
  taxId,
  item: propItem,
  canLink,
  setIsLinkModalOpen,
  setSelectedLineItem,
}: TaxDocumentViewProps) => {
  const [item, setItem] = useState<PublishedTaxInvoiceResponseModel | null>(
    propItem || null
  );
  const { getTaxInvoiceDetail, isLoading, error } = useGetTaxInvoiceDetail();

  useEffect(() => {
    // item이 있으면 그대로 사용, 없으면 taxId로 API 호출
    if (propItem) {
      setItem(propItem);
      return;
    } else if (!taxId) {
      return;
    }

    const fetchTaxInvoice = async () => {
      const result = await getTaxInvoiceDetail(taxId);
      if (result.success && result.data) {
        setItem(result.data);
      }
    };

    fetchTaxInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxId, propItem]);

  if (isLoading || error || !item) {
    return (
      <div className="flex items-center justify-center h-100">
        <Spinner />
      </div>
    );
  }

  // 세금계산서 상태가 published이면 발행일(발행 완료 일자)로 updated_at 사용
  const publishDate =
    item.publish_status === 'published' ? item.updated_at : null;

  return (
    <div className="flex flex-col gap-6">
      <DocInfo
        taxType={item.tax_invoice_type}
        transactionType={item.transaction_type}
        publishDate={publishDate}
      />
      <TaxBuyerProviderInfo
        taxType={item.tax_invoice_type}
        clientInfo={item.client_info}
        transactionType={item.transaction_type}
      />
      {item.tax_invoice_type === 'sales' && (
        <OrderItemInfo
          lineItems={item.line_items}
          transactionAmount={item.transaction_amount}
          taxAmount={item.tax_amount}
        />
      )}
      {item.tax_invoice_type === 'purchase' && (
        <PurchaseItemInfo
          lineItems={item.line_items}
          transactionAmount={item.transaction_amount}
          taxAmount={item.tax_amount}
          canLink={canLink}
          setIsLinkModalOpen={setIsLinkModalOpen}
          setSelectedLineItem={setSelectedLineItem}
        />
      )}
    </div>
  );
};

export default TaxDocumentView;
