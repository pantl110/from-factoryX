import { Suspense } from 'react';
import ProcessProjectPageInner from './process-project-page-inner';
import Spinner from '@/ui/spinner';

const ProcessProjectPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <ProcessProjectPageInner />
    </Suspense>
  );
};

export default ProcessProjectPage;
