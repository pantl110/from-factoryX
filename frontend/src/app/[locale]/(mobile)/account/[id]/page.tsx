'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TaxInvoiceAccountModel } from '@/types/data-model';
import { getTaxInvoiceAccountQueryFn } from '@/hooks';
import Topbar from '../../topbar';
import ClientInfo from '../../client-info';
import AccountInfo from '../account-info';
import MoBottomNavigation from '@/ui/mo-bottom-navigation';
import SupplierInfo from '../supplie-info';
import CreatePaymentModal from '../create-payment-modal';
import { Spinner } from '@/ui';

const AccountPageContent = () => {
  const t = useTranslations('mobile.topbar');
  const tTax = useTranslations('tax');
  const searchParams = useSearchParams();
  const params = useParams();
  const type = searchParams.get('type') as 'income' | 'outcome' | null;
  const accountId = params?.id ? Number(params.id) : null;
  const [isCreatePaymentModalOpen, setIsCreatePaymentModalOpen] =
    useState(false);
  const queryClient = useQueryClient();

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
    // 입금/지급 정보 입력 모달 열기 (매출/매입 모두)
    setIsCreatePaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    // 지급 정보 입력 성공 후 account 정보 다시 불러오기
    if (accountId) {
      queryClient.invalidateQueries({
        queryKey: ['tax-invoice-account', accountId, 'tax'],
      });
      // payment-details 쿼리도 무효화
      queryClient.invalidateQueries({
        queryKey: ['payment-details'],
      });
    }
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

      {/* 하단 바 버튼 */}
      <MoBottomNavigation
        type={type || 'income'}
        onClick={handleComplete}
        onConfirm={handleComplete}
      />

      {/* 지급 정보 입력 모달 */}
      {isCreatePaymentModalOpen && (
        <CreatePaymentModal
          onClose={() => setIsCreatePaymentModalOpen(false)}
          account={account}
          type="tax"
          onSuccess={handlePaymentSuccess}
        />
      )}
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
