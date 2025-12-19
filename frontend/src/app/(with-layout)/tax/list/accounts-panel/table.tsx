'use client';

import React, { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import TableItem from './table-item';
import { useGetPaymentDetails, useInfiniteScroll } from '@/hooks';
import { PaymentDetailResponseModel } from '@/types/data-model';
import { NoHistoryBox } from '@/ui';

interface TableProps {
  isPurchase: boolean;
  taxId: number;
}

const Table = ({ isPurchase, taxId }: TableProps) => {
  const { getPaymentDetails } = useGetPaymentDetails();

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
    queryKey: ['payment-details', taxId],
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    queryFn: async ({ pageParam = 1 }) => {
      const pageNumber =
        typeof pageParam === 'number' ? pageParam : Number(pageParam) || 1;
      const result = await getPaymentDetails(taxId, {
        page: pageNumber,
        page_size: 10,
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

  const remainHeader = isPurchase ? '미지급금(잔액)' : '미수금액(잔액)';
  const paidHeader = isPurchase ? '지급 금액' : '받은 금액';
  const expectedDateHeader = isPurchase ? '지급예정일' : '입금예정일';
  const dateHeader = isPurchase ? '지급일' : '입금일';

  const isInitialLoading = isLoading && paymentDetails.length === 0;

  if (isInitialLoading) {
    return null;
  }

  return (
    <div className="max-h-[600px] overflow-y-auto">
      {paymentDetails.length === 0 ? (
        <NoHistoryBox
          text={isPurchase ? '지급 내역이 없습니다.' : '입금 내역이 없습니다.'}
        />
      ) : (
        <>
          {/* 표 헤더 */}
          <div className="text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-1">
            <p className="flex-1 px-3">{expectedDateHeader}</p>
            <p className="flex-1 px-3">{dateHeader}</p>
            <p className="flex-1 px-3">{paidHeader}</p>
            <p className="flex-1 px-3">{remainHeader}</p>
            <p className="flex-1 px-3">연체일</p>
          </div>

          {/* 표 내용 */}
          {paymentDetails.map((item) => (
            <TableItem key={item.id} item={item} />
          ))}

          {/* 무한스크롤 트리거 및 로딩 표시 */}
          {hasNextPage && (
            <div
              ref={loadMoreRef}
              className="h-14 flex items-center justify-center"
            >
              {isFetchingNextPage && <div className="text-dg">로딩 중...</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Table;
