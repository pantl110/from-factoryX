import DocumentViewTitle from '../document-view-title';
import ProductListInfo from '../product-list-info';
import SupplierInfo from '../supplier-info';
import {
  QuotationProductDetailResponseModel,
  ClientModel,
} from '@/types/data-model';

interface QuotationDocumentViewProps {
  documentTitle: string;
  clientData: ClientModel;
  dueDate: string;
  productListInfoTitle: string;
  productItems: QuotationProductDetailResponseModel[];
  supplyAmount: number;
}

const QuotationDocumentView = ({
  documentTitle,
  clientData,
  dueDate,
  productListInfoTitle,
  productItems,
  supplyAmount,
}: QuotationDocumentViewProps) => {
  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle title={`[${clientData.name}]건 ${documentTitle}`} />
      <SupplierInfo clientData={clientData} dueDate={dueDate} />
      <ProductListInfo
        productListInfoTitle={productListInfoTitle}
        productItems={productItems}
        supplyAmount={supplyAmount}
      />
    </div>
  );
};

export default QuotationDocumentView;
