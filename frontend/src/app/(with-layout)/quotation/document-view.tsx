import React from "react";
import SupplierInfo from "./supplier-info";
import QuotationInfo from "./quotation-info";

const DocumentView = () => {
  return (
    <>
      <div className="flex justify-between ">
        <h2 className="Heading-2">[플라스틱이 좋아]건 견적서</h2>
        <div className="flex items-center gap-3 px-3 Heading-5 text-sv">
          <h5>발송일자</h5>
          <h5>2025-07-31</h5>
        </div>
      </div>

      <SupplierInfo />
      <QuotationInfo />
    </>
  );
};

export default DocumentView;
