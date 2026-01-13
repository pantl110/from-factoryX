'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { Suspense } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import { getTaxInvoiceAccountQueryFn } from '@/hooks';
import Topbar from '../../topbar';
import ClientInfo from '../../client-info';
import AccountInfo from '../account-info';
import MoBottomNavigation from '@/ui/mo-bottom-navigation';
import SupplierInfo from '../supplie-info';
import { Spinner } from '@/ui';

const AccountPageContent = () => {
  const t = useTranslations('mobile.topbar');
  const tTax = useTranslations('tax');
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const type = searchParams.get('type') as 'income' | 'outcome' | null;
  const accountId = params?.id ? Number(params.id) : null;

  const {
    data: account,
    isLoading,
    error,
  } = useQuery<TaxInvoiceAccountModel>({
    queryKey: ['tax-invoice-account', accountId, 'tax'],
    enabled: !!accountId,
    queryFn: () => {
      if (!accountId) {
        throw new Error('Account ID is required');
      }
      return getTaxInvoiceAccountQueryFn(accountId, 'tax');
    },
  });

  const clientInfo =
    account?.tax_invoice?.client_info ||
    account?.cash_receipt?.client_info ||
    null;

  const handleComplete = () => {
    // 입금 완료 또는 지급 완료 처리
    // TODO: 실제 API 호출 또는 상태 업데이트 로직 추가 필요
    router.back();
  };

  if (isLoading || error || !account) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="pb-23">
        <Topbar title={t('accountStatus')} />
        {type === 'income' && (
          <ClientInfo clientInfo={clientInfo} title={tTax('buyerInfo')} />
        )}
        {type === 'outcome' && <SupplierInfo clientInfo={clientInfo} />}
        <div className="h-2 bg-bg" />
        <AccountInfo type={type || 'income'} account={account} />
      </div>
      <MoBottomNavigation type={type || 'income'} onClick={handleComplete} />
    </>
  );
};

const AccountPage = () => {
  const tCommon = useTranslations('common');
  return (
    <Suspense fallback={<div>{tCommon('loading')}</div>}>
      <AccountPageContent />
    </Suspense>
  );
};

export default AccountPage;
