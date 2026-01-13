'use client';

import { useMemo, useState } from 'react';
import { CaretRight, Package } from '@phosphor-icons/react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Title from '../title';
import AlarmItem from '../alarm-item';
import {
  UndeliveredProductListResponseModel,
  UndeliveredProductModel,
} from '@/types/data-model';
import { useInfiniteScroll } from '@/hooks';
import useMemberStore from '@/store/member-store';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Spinner, MoBtn, NoHistoryBox } from '@/ui';

type ChipVariantType = 'secondary' | 'red-secondary' | 'outline';

const normalizeDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getChipInfo = (
  deliveryDate: string | null,
  t: (key: string, values?: Record<string, string | number>) => string
): { text: string; variant: ChipVariantType } => {
  if (!deliveryDate) {
    return { text: t('dueDateNotSpecified'), variant: 'outline' };
  }

  const today = normalizeDate(new Date());
  const target = normalizeDate(new Date(deliveryDate));
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (Number.isNaN(diff)) {
    return { text: t('dueDateNotSpecified'), variant: 'outline' };
  }

  if (diff < 0) {
    const daysPast = Math.abs(Math.round(diff));
    return {
      text: t('dueDatePast', { days: daysPast.toLocaleString() }),
      variant: 'red-secondary',
    };
  }

  if (diff === 0) {
    return { text: t('todayIsDeliveryDate'), variant: 'secondary' };
  }

  const daysRemaining = Math.round(diff);
  return {
    text: t('daysRemaining', { days: daysRemaining.toLocaleString() }),
    variant: 'outline',
  };
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
  limit?: number;
}

// 필터 번역값을 API 값으로 매핑
const filterToApiValue = (
  filter: string,
  tFilter: (key: string) => string
): 'today' | 'delayed' | 'scheduled' => {
  if (filter === tFilter('today')) {
    return 'today';
  }
  if (filter === tFilter('delayed')) {
    return 'delayed';
  }
  if (filter === tFilter('scheduled')) {
    return 'scheduled';
  }
  return 'today';
};

const DueDate = ({ hideWhenEmpty = false, limit }: DueDateProps) => {
  const t = useTranslations('mobile.alarm.tabs');
  const tFilter = useTranslations('mobile.alarm.filter');
  const tAlarm = useTranslations('mobile.alarm');
  const router = useRouter();
  const factoryId = useMemberStore((state) => state.factoryId);
  const baseDate = getTodayDateString();
  const [selectedFilter, setSelectedFilter] = useState<string>(
    tFilter('today')
  );
  // 전체 탭(limit이 있을 때)에서는 항상 "오늘"로 고정
  const dueFilter = limit ? 'today' : filterToApiValue(selectedFilter, tFilter);

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
    queryKey: [
      'undelivered-quotation-products',
      factoryId,
      baseDate,
      dueFilter,
    ],
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
              due_filter: dueFilter,
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
      const { text, variant } = getChipInfo(item.delivery_date, tAlarm);
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
        quotationProductId: item.quotation_product_id,
      };
    });
    if (limit && mapped.length > limit) {
      return mapped.slice(0, limit);
    }
    return mapped;
  }, [items, limit, tAlarm]);

  // 로딩 중이고 데이터가 없을 때는 Title 포함 전체 숨김
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  const shouldHideSection =
    hideWhenEmpty && !isInitialLoading && alarmItems.length === 0;
  if (shouldHideSection) {
    return null;
  }

  const renderContent = () => {
    if (alarmItems.length === 0 || errorMessage) {
      return (
        <div className="px-6 pt-4">
          <NoHistoryBox text={tAlarm('noDeliveryNotifications')} />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {alarmItems.map((item) => (
          <AlarmItem
            key={item.key}
            chipText={item.chipText}
            chipVariant={item.chipVariant}
            name={item.name}
            subText={item.subText}
            onClick={() => {
              if (!item.projectId || !item.quotationProductId) {
                return;
              }
              router.push(
                `/delivery/${item.quotationProductId}?project_id=${item.projectId}`
              );
            }}
          />
        ))}
        {limit && items.length > limit && (
          <div className="px-4 py-2">
            <MoBtn
              text={tAlarm('viewMore')}
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
      </div>
    );
  };

  const content = renderContent();

  if (!content) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-1 pt-4">
        <Title
          icon={<Package />}
          title={t('deliveryStatus')}
          count={totalCount}
          delivery={!limit}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
        {content}
      </div>
    </>
  );
};

export default DueDate;
