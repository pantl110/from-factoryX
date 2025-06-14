import React from "react";
import DocumentViewTitle from "./document-view-title";
import SupplierInfo from "./supplier-info";
import BuyerInfo from "./buyer-info";
import QuotationInfo from "./quotation-info";

const TransactionDocumentView = () => {
  return (
    <div className="width-[1000px] px-8 py-8 flex flex-col gap-6">
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
