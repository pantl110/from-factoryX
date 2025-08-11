import { QuotationResponseModel } from '@/types/data-model';
import DocumentViewTitle from '../document-view-title';
// import ProductListInfo from '../product-list-info';
import BuyerInfo from './buyer-info';
import SellerInfo from './seller-info';
import ProductListInfo from '../product-list-info';

interface TransactionDocumentViewProps {
  quotationData: QuotationResponseModel;
  startDate: string;
}

const TransactionDocumentView = ({
  quotationData,
  startDate,
}: TransactionDocumentViewProps) => {
  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle
        title={`[${quotationData.factory_name}]건 거래명세서`}
        // dateLabel="작성일자"
        // date="2025-07-31"
      />
      <SellerInfo startDate={startDate} />
      <BuyerInfo quotationData={quotationData} />
      <ProductListInfo
        productListInfoTitle="주문 품목 정보"
        productItems={quotationData.products}
        supplyAmount={quotationData.products.reduce(
          (sum, item) => sum + (item.supply_amount || 0),
          0
        )}
      />
    </div>
  );
};

export default TransactionDocumentView;
