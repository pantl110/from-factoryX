import { Suspense } from "react";
import QuotationPageContent from "./quotation-page-content";
import Spinner from "@/ui/spinner";

const QuotationPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <QuotationPageContent />
    </Suspense>
  );
};

export default QuotationPage;
