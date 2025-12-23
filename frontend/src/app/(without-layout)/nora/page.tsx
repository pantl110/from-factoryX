'use client';

import dynamic from 'next/dynamic';

const NoraComponent = dynamic(() => import('@/nora/nora-component'), {
  ssr: false,
});

const NoraPage = () => {
  return (
    <div className="h-[calc(100vh-64px)]">
      <NoraComponent />
    </div>
  );
};

export default NoraPage;
