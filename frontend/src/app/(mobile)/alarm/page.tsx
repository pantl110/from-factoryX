'use client';

import Topbar from '../topbar';
import Tabbar from './tabbar';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import DueDate from './due-date';
// import PaymentDue from './payment-due';
import Expiry from './expiry';
import ConfirmationRequired from './confirmation-required';
import Rop from './rop';

const AlarmContent = () => {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'all';
  const router = useRouter();

  const renderContent = () => {
    switch (currentTab) {
      case 'due-date':
        return (
          <div className="pb-6">
            <DueDate />
          </div>
        );
      // case 'payment-due':
      //   return (
      //     <div className="pb-6">
      //       <PaymentDue />
      //     </div>
      //   );
      case 'expiry':
        return (
          <div className="pb-6">
            <Expiry />
          </div>
        );
      case 'confirmation-required':
        return (
          <div className="pb-6">
            <ConfirmationRequired />
          </div>
        );
      case 'rop':
        return (
          <div className="pb-6">
            <Rop />
          </div>
        );
      case 'all':
      default:
        return (
          <div className="flex flex-col pb-6">
            <DueDate hideWhenEmpty withDivider limit={5} />
            {/* <PaymentDue /> */}
            {/* <div className="h-1 bg-bg" /> */}
            <Rop hideWhenEmpty withDivider limit={5} />
            <Expiry />
            <div className="h-1 bg-bg" />
            <ConfirmationRequired hideWhenEmpty limit={5} />
          </div>
        );
    }
  };

  return (
    <>
      <Topbar title="알림" onBackClick={() => router.push('/dashboard')} />
      <Tabbar />
      {renderContent()}
    </>
  );
};

const AlarmPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AlarmContent />
    </Suspense>
  );
};

export default AlarmPage;
