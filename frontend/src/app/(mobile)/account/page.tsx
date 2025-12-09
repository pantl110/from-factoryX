'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../topbar';
import ClientInfo from '../client-info';
import AccountInfo from './account-info';
import MoBottomNavigation from '@/ui/mo-bottom-navigation';
import SupplierInfo from './supplie-info';

const AccountPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') as 'income' | 'outcome' | null;

  const handleComplete = () => {
    // 입금 완료 또는 지급 완료 처리
    // TODO: 실제 API 호출 또는 상태 업데이트 로직 추가 필요
    router.back();
  };

  return (
    <>
      <div className="pb-23">
        <Topbar title="정산 현황" />
        {type === 'income' && <ClientInfo />}
        {type === 'outcome' && <SupplierInfo />}
        <div className="h-2 bg-bg" />
        <AccountInfo type={type || 'income'} />
      </div>
      <MoBottomNavigation type={type || 'income'} onClick={handleComplete} />
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
