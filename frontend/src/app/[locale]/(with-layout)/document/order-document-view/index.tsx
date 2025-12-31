'use client';

import { useTranslations } from 'next-intl';
import DocumentViewTitle from '../document-view-title';
import ProductListInfo from '../product-list-info';
import SupplierInfo from '../supplier-info';
import {
  QuotationProductDetailResponseModel,
  ClientModel,
} from '@/types/data-model';

interface OrderDocumentViewProps {
  documentTitle: string;
  clientData: ClientModel;
  dueDate: string;
  productListInfoTitle: string;
  productItems: QuotationProductDetailResponseModel[];
  supplyAmount: number;
  taxAmount: number;
}

const OrderDocumentView = ({
  documentTitle,
  clientData,
  dueDate,
  productListInfoTitle,
  productItems,
  supplyAmount,
  taxAmount,
}: OrderDocumentViewProps) => {
  const t = useTranslations('document');
  const tCommon = useTranslations('common');

  const formattedTitle = t('documentTitleFormat', {
    clientName: clientData.name,
    case: tCommon('count'),
    title: documentTitle,
  });

  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle title={formattedTitle} />
      <SupplierInfo clientData={clientData} dueDate={dueDate} />
      <ProductListInfo
        productListInfoTitle={productListInfoTitle}
        productItems={productItems}
        supplyAmount={supplyAmount}
        taxAmount={taxAmount}
      />
    </div>
  );
};

export default OrderDocumentView;
