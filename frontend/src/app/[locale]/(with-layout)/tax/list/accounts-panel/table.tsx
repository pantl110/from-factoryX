'use client';

import React, { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import TableItem from './table-item';
import { useGetPaymentDetails, useInfiniteScroll } from '@/hooks';
import { PaymentDetailResponseModel } from '@/types/data-model';
import { NoHistoryBox } from '@/ui';
import useSubscriptionStore from '@/store/subscription-store';
import useMemberStore from '@/store/member-store';
import { useTranslations } from 'next-intl';

interface TableProps {
  isPurchase: boolean;
  taxId: number;
  type?: 'tax' | 'cash-receipt';
  onOpenDeleteAccountPaymentModal: (paymentId: number) => void;
  onOpenEditAccountPaymentModal: (
    paymentDetail: PaymentDetailResponseModel
  ) => void;
}

const Table = ({
  isPurchase,
  taxId,
  type = 'tax',
  onOpenDeleteAccountPaymentModal,
  onOpenEditAccountPaymentModal,
}: TableProps) => {
  const t = useTranslations('tax.list.tableArea.table');
  const tLabels = useTranslations('tax.list.accountPayment.labels');
  const tCommon = useTranslations('common');
  const { getPaymentDetails } = useGetPaymentDetails();
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const isProdManager = role === 'prod_manager';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const {
    data,
    fetchNextPage,
    hasNextPage = false,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery<{
    items: PaymentDetailResponseModel[];
    nextPage: number | null;
  }>({
    queryKey: ['payment-details', taxId, type],
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    queryFn: async ({ pageParam = 1 }) => {
      const pageNumber =
        typeof pageParam === 'number' ? pageParam : Number(pageParam) || 1;
      const result = await getPaymentDetails(taxId, {
        page: pageNumber,
        page_size: 10,
        type,
      });

      if (!result.success || !result.data) {
        return { items: [], nextPage: null };
      }

      const items = result.data.data || [];
      const currentPage = result.data.curPage ?? pageNumber;
      const totalPages = result.data.pageCnt || 1;
      const nextPage = currentPage < totalPages ? currentPage + 1 : null;

      return {
        items,
        nextPage,
      };
    },
    enabled: !!taxId,
  });

  const paymentDetails = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  // 무한스크롤 hook
  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    enabled: true,
    hasMore: hasNextPage,
    isLoading: isLoading && paymentDetails.length === 0,
    isFetchingMore: isFetchingNextPage,
    onLoadMore: () => {
      if (hasNextPage) {
        fetchNextPage();
      }
    },
  });

  const remainHeader = isPurchase
    ? t('headers.payableAmount')
    : t('headers.receivableAmount');
  const paidHeader = isPurchase
    ? tLabels('paymentAmount')
    : tLabels('receivedAmount');
  const expectedDateHeader = isPurchase
    ? t('headers.scheduledPaymentDate')
    : t('headers.scheduledDepositDate');
  const dateHeader = isPurchase
    ? tLabels('paymentDate')
    : tLabels('depositDate');

  const isInitialLoading = isLoading && paymentDetails.length === 0;

  if (isInitialLoading) {
    return null;
  }

  return (
    <div className="max-h-[600px] overflow-y-auto">
      {paymentDetails.length === 0 ? (
        <NoHistoryBox
          text={isPurchase ? t('empty.payment') : t('empty.deposit')}
        />
      ) : (
        <>
          {/* 표 헤더 */}
          <div className="text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-1 cursor-default">
            <p className="flex-1 px-3">{expectedDateHeader}</p>
            <p className="flex-1 px-3">{dateHeader}</p>
            <p className="flex-[1.2] px-3">{paidHeader}</p>
            <p className="flex-[1.2] px-3">{remainHeader}</p>
            <p className="flex-1 px-3">{t('headers.overdueDays')}</p>
            {!isViewer && !isProdManager && hasSubscription() && (
              <p className="w-30 px-3">{tCommon('action')}</p>
            )}
          </div>

          {/* 표 내용 */}
          {paymentDetails.map((item) => (
            <TableItem
              key={item.id}
              item={item}
              onOpenDeleteModal={onOpenDeleteAccountPaymentModal}
              onOpenEditModal={onOpenEditAccountPaymentModal}
            />
          ))}

          {/* 무한스크롤 트리거 및 로딩 표시 */}
          {hasNextPage && (
            <div
              ref={loadMoreRef}
              className="h-14 flex items-center justify-center"
            >
              {isFetchingNextPage && (
                <div className="text-dg">{tCommon('loading')}</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Table;
