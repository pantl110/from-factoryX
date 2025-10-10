'use client';

import Topbar from './topbar';
import Tabbar from './tabbar';
import { useSearchParams } from 'next/navigation';
import DueDate from './due-date';
import PaymentDue from './payment-due';
import Expiry from './expiry';
import ConfirmationRequired from './confirmation-required';
import Rop from './rop';

const AlarmPage = () => {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'all';

  const renderContent = () => {
    switch (currentTab) {
      case 'due-date':
        return <DueDate />;
      case 'payment-due':
        return <PaymentDue />;
      case 'expiry':
        return <Expiry />;
      case 'confirmation-required':
        return <ConfirmationRequired />;
      case 'rop':
        return <Rop />;
      case 'all':
      default:
        return (
          <>
            <DueDate />
            <div className="h-1 bg-bg" />
            <PaymentDue />
            <div className="h-1 bg-bg" />
            <Rop />
            <div className="h-1 bg-bg" />
            <Expiry />
            <div className="h-1 bg-bg" />
            <ConfirmationRequired />
          </>
        );
    }
  };

  return (
    <>
      <Topbar />
      <Tabbar />
      {renderContent()}
    </>
  );
};

export default AlarmPage;
