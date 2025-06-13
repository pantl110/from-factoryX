import React from "react";
import SupplierInfo from "./supplier-info";
import QuotationInfo from "./quotation-info";

const DocumentView = () => {
  return (
    <>
      <div className="flex justify-between ">
        <div className="Heading-2">[플라스틱이 좋아]건 견적서</div>
        <div className="flex items-center gap-3 px-3 Heading-5 text-sv">
          <div>발송일자</div>
          <div>2025-07-31</div>
        </div>
      </div>

      <SupplierInfo />
      <QuotationInfo />
    </>
  );
};

export default DocumentView;
