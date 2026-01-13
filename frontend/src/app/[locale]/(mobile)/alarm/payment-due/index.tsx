'use client';

import { useMemo } from 'react';
import { MoneyWavy } from '@phosphor-icons/react';
import { useRouter } from '@/i18n/navigation';
import Title from '../title';
import AlarmItem from '../alarm-item';
import {
  PublishedTaxInvoiceResponseModel,
  PublishedTaxInvoiceListResponseModel,
} from '@/types/data-model';
import { getDaysDiff, formatISODate } from '@/utils';
import { Spinner, NoHistoryBox } from '@/ui';
import { useInfiniteScroll, useTaxApi } from '@/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';

const paymentDuePageSize = 10;

const formatAmount = (amount: number) => {
  return amount.toLocaleString();
};

const getChipInfo = (
  agreedPaymentDate: string,
  taxInvoiceType: 'sales' | 'purchase'
): { text: string; variant: 'secondary' | 'red-secondary' | 'outline' } => {
  const diffDays = getDaysDiff(new Date(), agreedPaymentDate);

  if (taxInvoiceType === 'sales') {
    return {
      text: `거래처의 입금이 ${diffDays}일째 지연되고 있어요!`,
      variant: 'red-secondary',
    };
  }

  return {
    text: `우리 지급이 ${diffDays}일째 연체되고 있어요!`,
    variant: 'secondary',
  };
};

const PaymentDue = () => {
  const router = useRouter();
  const factoryId = useMemberStore((state) => state.factoryId);
  const { callTaxApi } = useTaxApi();

  const {
    data,
    fetchNextPage,
    hasNextPage = false,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery<{
    items: PublishedTaxInvoiceResponseModel[];
    totalCount: number;
    nextPage: number | null;
  }>({
    queryKey: ['payment-due-tax-invoices', factoryId],
    enabled: !!factoryId,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    queryFn: async ({ pageParam = 1 }) => {
      const pageNumber =
        typeof pageParam === 'number' ? pageParam : Number(pageParam) || 1;

      if (!factoryId) {
        return { items: [], totalCount: 0, nextPage: null };
      }

      const result = await callTaxApi<PublishedTaxInvoiceListResponseModel>(
        'published',
        {
          queryParams: {
            is_hidden: false,
            ordering: '-transaction_date',
            account_status: 'overdue',
            page: pageNumber,
            page_size: paymentDuePageSize,
          },
        }
      );

      if (!result.success || !result.data) {
        throw new Error(
          result.error || 'Failed to fetch payment due tax invoices'
        );
      }

      const items: PublishedTaxInvoiceResponseModel[] = result.data.data || [];
      const totalCount =
        result.data.totalCnt ?? result.data.count ?? items.length ?? 0;
      const currentPage = result.data.curPage ?? pageNumber;
      const totalPages =
        result.data.pageCnt ??
        Math.max(1, Math.ceil(totalCount / paymentDuePageSize));
      const nextPage =
        result.data.nextPage ??
        (currentPage < totalPages ? currentPage + 1 : null);

      return {
        items,
        totalCount,
        nextPage,
      };
    },
  });

  const taxInvoices = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const totalCount = data?.pages[0]?.totalCount ?? taxInvoices.length ?? 0;
  const hasTaxInvoices = taxInvoices.length > 0;
  const isInitialLoading = isLoading && !hasTaxInvoices;
  const errorMessage =
    error instanceof Error ? error.message : error ? String(error) : null;

  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    enabled: true,
    hasMore: hasNextPage,
    isLoading: isInitialLoading,
    isFetchingMore: isFetchingNextPage,
    onLoadMore: () => {
      if (hasNextPage) {
        fetchNextPage();
      }
    },
  });

  // 로딩 중이고 데이터가 없을 때는 Title 포함 전체 숨김
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  const renderContent = () => {
    if (errorMessage || !hasTaxInvoices) {
      return (
        <div className="px-6 pt-4">
          <NoHistoryBox text="정산 현황 알림이 없어요." />
        </div>
      );
    }

    return (
      <>
        {taxInvoices.map((taxInvoice) => {
          const account = taxInvoice.account;
          const { text: chipText, variant: chipVariant } = getChipInfo(
            account?.agreed_payment_date!,
            taxInvoice.tax_invoice_type
          );

          const clientName = taxInvoice.client_info?.name || '-';
          const agreedDate =
            formatISODate(account?.agreed_payment_date || null) || '-';
          const amount = formatAmount(
            account?.outstanding_balance || taxInvoice.transaction_amount || 0
          );
          const subText = `${agreedDate} · ${amount}원`;
          const subChipText =
            taxInvoice.tax_invoice_type === 'sales' ? '매출' : '매입';

          return (
            <AlarmItem
              key={taxInvoice.id}
              chipText={chipText}
              chipVariant={chipVariant}
              name={clientName}
              subText={subText}
              subChipText={subChipText}
              onClick={() => {
                const type =
                  taxInvoice.tax_invoice_type === 'sales'
                    ? 'income'
                    : 'outcome';
                router.push(`/account/${taxInvoice.id}?type=${type}`);
              }}
            />
          );
        })}
        {hasNextPage && (
          <div ref={loadMoreRef} className="w-full h-1" aria-hidden="true" />
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-1 pt-4">
      <Title icon={<MoneyWavy />} title="정산 현황" count={totalCount} />
      {renderContent()}
    </div>
  );
};

export default PaymentDue;
