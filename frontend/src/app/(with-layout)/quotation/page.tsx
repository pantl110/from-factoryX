import { Suspense } from "react";
import QuotationPageContent from "./quotation-page-content";

const QuotationPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuotationPageContent />
    </Suspense>
  );
};

export default QuotationPage;
