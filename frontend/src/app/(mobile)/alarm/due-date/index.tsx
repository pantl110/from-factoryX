'use client';

import { useMemo } from 'react';
import { CaretRight, Package } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import Title from '../title';
import AlarmItem from '../alarm-item';
import NoHistoryBox from '@/ui/no-history-box';
import {
  UndeliveredProductListResponseModel,
  UndeliveredProductModel,
} from '@/types/data-model';
import { useInfiniteScroll } from '@/hooks';
import useMemberStore from '@/store/member-store';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import MoBtn from '@/ui/mo-btn';

type ChipVariant = 'secondary' | 'red-secondary' | 'outline';

const normalizeDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getChipInfo = (
  deliveryDate: string | null
): { text: string; variant: ChipVariant } => {
  if (!deliveryDate) {
    return { text: '납기일 미지정', variant: 'outline' };
  }

  const today = normalizeDate(new Date());
  const target = normalizeDate(new Date(deliveryDate));
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (Number.isNaN(diff)) {
    return { text: '납기일 미지정', variant: 'outline' };
  }

  if (diff < 0) {
    return {
      text: `납기일이 ${Math.abs(Math.round(diff))}일 지났어요!`,
      variant: 'red-secondary',
    };
  }

  if (diff === 0) {
    return { text: '오늘이 납품일이에요!', variant: 'secondary' };
  }

  return { text: `D-${Math.round(diff)}`, variant: 'outline' };
};

const formatSubText = (
  productName: string,
  productCode?: string,
  productUnit?: string,
  quantity?: number
) => {
  return `${productName}(${productCode}) · ${quantity?.toLocaleString()}${productUnit}`;
};

const dueDatePageSize = 10;
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DueDateProps {
  hideWhenEmpty?: boolean;
  withDivider?: boolean;
  limit?: number;
}

const DueDate = ({
  hideWhenEmpty = false,
  withDivider = false,
  limit,
}: DueDateProps) => {
  const router = useRouter();
  const factoryId = useMemberStore((state) => state.factoryId);
  const baseDate = getTodayDateString();
  const {
    data,
    fetchNextPage,
    hasNextPage = false,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery<{
    items: UndeliveredProductModel[];
    totalCount: number;
    nextPage: number | null;
  }>({
    queryKey: ['undelivered-quotation-products', factoryId, baseDate],
    enabled: !!factoryId,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    queryFn: async ({ pageParam = 1 }) => {
      const pageNumber =
        typeof pageParam === 'number' ? pageParam : Number(pageParam) || 1;

      if (!factoryId) {
        return { items: [], totalCount: 0, nextPage: null };
      }

      const { data: result } =
        await axios.get<UndeliveredProductListResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/document/quotation/product/undelivered`,
          {
            params: {
              factory_id: factoryId,
              page: pageNumber,
              page_size: dueDatePageSize,
              base_date: baseDate,
            },
            withCredentials: true,
          }
        );

      const items: UndeliveredProductModel[] = result.data || [];
      const totalCount = result.totalCnt ?? result.count ?? items.length ?? 0;
      const currentPage = result.curPage ?? pageNumber;
      const totalPages =
        result.pageCnt ?? Math.max(1, Math.ceil(totalCount / dueDatePageSize));
      const nextPage =
        result.nextPage ?? (currentPage < totalPages ? currentPage + 1 : null);

      return {
        items,
        totalCount,
        nextPage,
      };
    },
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );
  const totalCount = data?.pages[0]?.totalCount ?? items.length ?? 0;
  const isInitialLoading = isLoading && items.length === 0;
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

  const alarmItems = useMemo(() => {
    const mapped = items.map((item, index) => {
      const { text, variant } = getChipInfo(item.delivery_date);
      return {
        key: index,
        chipText: text,
        chipVariant: variant,
        name: item.company_name,
        subText: formatSubText(
          item.product_name,
          item.product_code,
          item.product_unit,
          item.quantity
        ),
        projectId: item.project_id,
      };
    });
    if (limit && mapped.length > limit) {
      return mapped.slice(0, limit);
    }
    return mapped;
  }, [items, limit]);

  const shouldHideSection =
    hideWhenEmpty && !isInitialLoading && alarmItems.length === 0;
  if (shouldHideSection) {
    return null;
  }

  const renderContent = () => {
    if (isInitialLoading) {
      return <></>;
    }

    if (alarmItems.length === 0 || errorMessage) {
      return (
        <div className="px-6 pt-4">
          <NoHistoryBox text="납기 도래 알림이 없어요." />
        </div>
      );
    }

    return (
      <>
        {alarmItems.map((item) => (
          <AlarmItem
            key={item.key}
            chipText={item.chipText}
            chipVariant={item.chipVariant}
            name={item.name}
            subText={item.subText}
            onClick={() => {
              if (!item.projectId) {
                return;
              }
              router.push(`/delivery/${item.projectId}`);
            }}
          />
        ))}
        {limit && items.length > limit && (
          <div className="px-4 py-2">
            <MoBtn
              text="더 보기"
              variant="outline"
              icon={<CaretRight />}
              width="w-full"
              onClick={() => router.push('/alarm?tab=due-date')}
            />
          </div>
        )}
        {hasNextPage && (
          <div ref={loadMoreRef} className="w-full h-1" aria-hidden="true" />
        )}
      </>
    );
  };

  const content = renderContent();

  if (!content) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-1 pt-4">
        <Title icon={<Package />} title="납기 도래" count={totalCount} />
        {content}
      </div>
      {withDivider && <div className="h-1 bg-bg" />}
    </>
  );
};

export default DueDate;
