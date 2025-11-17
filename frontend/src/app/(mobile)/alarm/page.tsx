'use client';

import Topbar from '../topbar';
import Tabbar from './tabbar';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
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
        return <DueDate />;
      // case 'payment-due':
      //   return <PaymentDue />;
      case 'expiry':
        return <Expiry />;
      case 'confirmation-required':
        return <ConfirmationRequired />;
      case 'rop':
        return <Rop />;
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
            <ConfirmationRequired />
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
