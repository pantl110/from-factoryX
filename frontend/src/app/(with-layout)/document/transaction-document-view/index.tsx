import DocumentViewTitle from '../document-view-title';
import ProductListInfo from '../product-list-info';
import BuyerInfo from './buyer-info';
import SellerInfo from './seller-info';

const TransactionDocumentView = () => {
  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle
        title="[플라스틱이 좋아]건 거래명세서"
        dateLabel="작성일자"
        date="2025-07-31"
      />
      <SellerInfo />
      <BuyerInfo />
      <ProductListInfo transaction />
    </div>
  );
};

export default TransactionDocumentView;
