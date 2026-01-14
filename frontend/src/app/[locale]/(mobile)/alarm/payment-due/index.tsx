'use client';

import { useMemo } from 'react';
import { MoneyWavy } from '@phosphor-icons/react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Title from '../title';
import AlarmItem from '../alarm-item';
import {
  PublishedDocumentOutModel,
  PublishedDocumentListResponseModel,
} from '@/types/data-model';
import { getDaysDiff, formatISODate } from '@/utils';
import { Spinner, NoHistoryBox } from '@/ui';
import { useInfiniteScroll } from '@/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import axios from 'axios';

const paymentDuePageSize = 10;

const formatAmount = (amount: number) => {
  return amount.toLocaleString();
};

const PaymentDue = () => {
  const router = useRouter();
  const factoryId = useMemberStore((state) => state.factoryId);
  const t = useTranslations('mobile.alarm.paymentDue');
  const tTabs = useTranslations('mobile.alarm.tabs');
  const tTax = useTranslations('tax');
  const tCommon = useTranslations('common');

  const {
    data,
    fetchNextPage,
    hasNextPage = false,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery<{
    items: PublishedDocumentOutModel[];
    totalCount: number;
    nextPage: number | null;
  }>({
    queryKey: ['payment-due-documents', factoryId],
    enabled: !!factoryId,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    queryFn: async ({ pageParam = 1 }) => {
      const pageNumber =
        typeof pageParam === 'number' ? pageParam : Number(pageParam) || 1;

      if (!factoryId) {
        return { items: [], totalCount: 0, nextPage: null };
      }

      try {
        const response = await axios.get<PublishedDocumentListResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v2/tax/published`,
          {
            params: {
              factory_id: factoryId,
              is_hidden: false,
              ordering: 'agreed_payment_date', // 과거가 앞에 오도록 오름차순
              account_status: 'overdue',
              page: pageNumber,
              page_size: paymentDuePageSize,
            },
            withCredentials: true,
          }
        );

        const items: PublishedDocumentOutModel[] = response.data.data || [];
        const totalCount =
          response.data.totalCnt ?? response.data.count ?? items.length ?? 0;
        const currentPage = response.data.curPage ?? pageNumber;
        const totalPages =
          response.data.pageCnt ??
          Math.max(1, Math.ceil(totalCount / paymentDuePageSize));
        const nextPage =
          response.data.nextPage ??
          (currentPage < totalPages ? currentPage + 1 : null);

        return {
          items,
          totalCount,
          nextPage,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            t('errors.fetchFailed');
          throw new Error(message);
        }
        throw error;
      }
    },
  });

  const documents = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const totalCount = data?.pages[0]?.totalCount ?? documents.length ?? 0;
  const hasDocuments = documents.length > 0;
  const isInitialLoading = isLoading && !hasDocuments;
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
    // 로딩 중이거나 에러가 있을 때는 아무것도 표시하지 않음 (이미 위에서 Spinner 처리됨)
    if (isLoading || errorMessage) {
      return null;
    }

    // 데이터가 없을 때만 NoHistoryBox 표시
    if (!hasDocuments) {
      return (
        <div className="px-6 pt-4">
          <NoHistoryBox text={t('empty.noAlerts')} />
        </div>
      );
    }

    return (
      <>
        {documents.map((document) => {
          const { account } = document;
          const agreedPaymentDate = account?.agreed_payment_date;
          if (!agreedPaymentDate) {
            return null;
          }

          // 문서 유형에 따라 타입 결정
          // 세금계산서: tax_invoice_type 사용, 현금영수증: 항상 'purchase' (현금영수증은 매입만 있음)
          const invoiceType =
            document.document_type === 'tax'
              ? document.tax_invoice_type
              : 'purchase';

          if (!invoiceType) {
            return null;
          }

          const diffDays = getDaysDiff(new Date(), agreedPaymentDate);
          const chipText =
            document.document_type === 'tax' && invoiceType === 'sales'
              ? t('chip.clientPaymentDelayed', { days: diffDays })
              : t('chip.ourPaymentOverdue', { days: diffDays });
          const chipVariant =
            document.document_type === 'tax' && invoiceType === 'sales'
              ? 'red-secondary'
              : 'secondary';

          const clientName = document.client_name || '-';
          const agreedDate =
            formatISODate(account?.agreed_payment_date || null) || '-';
          const amount = formatAmount(
            account?.outstanding_balance || document.total_amount || 0
          );
          const subText = `${agreedDate} · ${amount}${tCommon('won')}`;

          // 서브 칩 텍스트 결정
          let subChipText = '';
          if (document.document_type === 'tax') {
            subChipText =
              invoiceType === 'sales' ? tTax('sales') : tTax('purchase');
          } else {
            subChipText = tTax('purchase');
          }

          // 라우팅 타입 결정
          const type = invoiceType === 'sales' ? 'income' : 'outcome';

          return (
            <AlarmItem
              key={`${document.document_type}-${document.id}`}
              chipText={chipText}
              chipVariant={chipVariant}
              name={clientName}
              subText={subText}
              subChipText={subChipText}
              onClick={() => {
                router.push(`/account/${document.id}?type=${type}`);
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
      <Title
        icon={<MoneyWavy />}
        title={tTabs('accountStatus')}
        count={totalCount}
      />
      {renderContent()}
    </div>
  );
};

export default PaymentDue;
