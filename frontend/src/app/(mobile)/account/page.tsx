'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Topbar from '../topbar';
import ClientInfo from '../client-info';
import AccountInfo from './account-info';
import MoBottomNavigation from '@/ui/mo-bottom-navigation';
import SupplierInfo from './supplie-info';

const AccountPageContent = () => {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as 'income' | 'outcome' | null;

  return (
    <>
      <div className="pb-23">
        <Topbar title="정산 현황" />
        {type === 'income' && <ClientInfo />}
        {type === 'outcome' && <SupplierInfo />}
        <div className="h-2 bg-bg" />
        <AccountInfo type={type || 'income'} />
      </div>
      <MoBottomNavigation type={type || 'income'} />
    </>
  );
};

const AccountPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountPageContent />
    </Suspense>
  );
};

export default AccountPage;
