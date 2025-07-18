import Spinner from '@/ui/spinner';

import { Suspense } from 'react';
import SettingPageContent from './setting-page-content';

const SettingPage = async () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <SettingPageContent />
    </Suspense>
  );
};

export default SettingPage;
