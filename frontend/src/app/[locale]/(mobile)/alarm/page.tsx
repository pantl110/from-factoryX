'use client';

import Topbar from '../topbar';
import Tabbar from './tabbar';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import DueDate from './due-date';
import PaymentDue from './payment-due';
import Expiry from './expiry';
import ConfirmationRequired from './confirmation-required';
import Rop from './rop';

const AlarmContent = () => {
  const t = useTranslations('mobile.topbar');
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
      case 'payment-due':
        return (
          <div className="pb-6">
            <PaymentDue />
          </div>
        );
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
          <div className="flex flex-col border-b border-bg pb-6 divide-y-[4px] divide-bg">
            <DueDate hideWhenEmpty limit={5} />
            <PaymentDue />
            <Rop hideWhenEmpty limit={5} />
            <Expiry hideWhenEmpty limit={5} />
            <ConfirmationRequired hideWhenEmpty limit={5} />
          </div>
        );
    }
  };

  return (
    <>
      <Topbar
        title={t('notification')}
        onBackClick={() => router.push('/dashboard')}
      />
      <Tabbar />
      {renderContent()}
    </>
  );
};

const AlarmPage = () => {
  return (
    <Suspense fallback={null}>
      <AlarmContent />
    </Suspense>
  );
};

export default AlarmPage;
