import SupplierInfo from "../supplier-info";
import QuotationInfo from "../quotation-info";
import DocumentViewTitle from "../document-view-title";

const QuotationDocumentView = () => {
  return (
    <div className="width-[1000px] px-8 py-8 flex flex-col gap-6">
      <DocumentViewTitle
        title="[플라스틱이 좋아]건 견적서"
        dateLabel="발송일자"
        date="2025-07-31"
      />
      <SupplierInfo dateLabel="납기일자" />
      <QuotationInfo />
    </div>
  );
};

export default QuotationDocumentView;
