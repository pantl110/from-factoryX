import DocumentViewTitle from "../document-view-title";
import SupplierInfo from "../supplier-info";
import BuyerInfo from "../buyer-info";
import QuotationInfo from "../quotation-info";

const TransactionDocumentView = () => {
  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle
        title="[플라스틱이 좋아]건 거래명세서"
        dateLabel="작성일자"
        date="2025-07-31"
      />
      <SupplierInfo dateLabel="거래일자" />
      <BuyerInfo />
      <QuotationInfo />
    </div>
  );
};

export default TransactionDocumentView;
