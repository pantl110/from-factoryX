'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Topbar from '../topbar';
import ClientInfo from '../client-info';
import AccountInfo from './account-info';
import MoBottomNavigation from '@/ui/mo-bottom-navigation';
import SupplierInfo from './supplie-info';

const AccountPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as 'income' | 'outcome' | null;

  return (
    <>
      <div className="pb-23">
        <Topbar title="정산 현황" onBackClick={() => router.back()} />
        {type === 'income' && <ClientInfo />}
        {type === 'outcome' && <SupplierInfo />}
        <div className="h-2 bg-bg" />
        <AccountInfo type={type || 'income'} />
      </div>
      <MoBottomNavigation type={type || 'income'} />
    </>
  );
};

export default AccountPage;
