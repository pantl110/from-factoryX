import { Suspense } from "react";
import ProcessProjectPageInner from "./process-project-page-inner";

const ProcessProjectPage = () => {
  return (
    <Suspense fallback={null}>
      <ProcessProjectPageInner />
    </Suspense>
  );
};

export default ProcessProjectPage;
