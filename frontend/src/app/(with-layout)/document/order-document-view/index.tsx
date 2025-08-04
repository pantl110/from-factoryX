import ClientInfo from '../../tax/list/modals/create-tax-panel/client-info';
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
}

const OrderDocumentView = ({
  documentTitle,
  clientData,
  dueDate,
  productListInfoTitle,
  productItems,
  supplyAmount,
}: OrderDocumentViewProps) => {
  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle
        title={`[${clientData.name}]건 ${documentTitle}`}
        // dateLabel="발송일자"
        // date="2025-07-31"
      />
      <SupplierInfo clientData={clientData} dueDate={dueDate} />
      <ProductListInfo
        productListInfoTitle={productListInfoTitle}
        productItems={productItems}
        supplyAmount={supplyAmount}
      />
    </div>
  );
};

export default OrderDocumentView;
