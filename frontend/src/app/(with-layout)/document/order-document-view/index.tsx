import DocumentViewTitle from "../document-view-title";
import QuotationInfo from "../quotation-info";
import BuyerInfo from "../buyer-info";

const OrderDocumentView = () => {
  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle
        title="[플라스틱이 좋아]건 주문서"
        dateLabel="발송일자"
        date="2025-07-31"
      />
      <BuyerInfo />
      <QuotationInfo title="주문 품목 정보" />
    </div>
  );
};

export default OrderDocumentView;
