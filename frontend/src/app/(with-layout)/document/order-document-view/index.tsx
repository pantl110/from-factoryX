import DocumentViewTitle from "../document-view-title";
import ProductListInfo from "../product-list-info";
import ClientInfo from "./client-info";

const OrderDocumentView = () => {
  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle
        title="[플라스틱이 좋아]건 주문서"
        dateLabel="발송일자"
        date="2025-07-31"
      />
      <ClientInfo />
      <ProductListInfo />
    </div>
  );
};

export default OrderDocumentView;
