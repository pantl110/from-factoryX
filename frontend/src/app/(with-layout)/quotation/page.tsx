import { Suspense } from "react";
import QuotationPageContent from "./quotation-page-content";

const QuotationPage = () => {
  return (
    <Suspense fallback={null}>
      <QuotationPageContent />
    </Suspense>
  );
};

export default QuotationPage;
