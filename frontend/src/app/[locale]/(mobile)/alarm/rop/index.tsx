import { useMemo } from 'react';
import { CaretRight, MoneyWavy } from '@phosphor-icons/react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useInfiniteQuery } from '@tanstack/react-query';
import Title from '../title';
import AlarmItem from '../alarm-item';
import { MaterialResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import { useInfiniteScroll, useGetMaterial } from '@/hooks';
import MoBtn from '@/ui/mo-btn';

interface RopProps {
  hideWhenEmpty?: boolean;
  limit?: number;
}

const formatStockValue = (value?: number) =>
  typeof value === 'number' ? value.toLocaleString() : '-';

const shortagePageSize = 10;

const Rop = ({ hideWhenEmpty = false, limit }: RopProps) => {
  const t = useTranslations('mobile.alarm.tabs');
  const tAlarm = useTranslations('mobile.alarm');
  const router = useRouter();
  const { getMaterialList } = useGetMaterial();

  const {
    data,
    fetchNextPage,
    hasNextPage = false,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery<{
    items: MaterialResponseModel[];
    totalCount: number;
    nextPage: number | null;
  }>({
    queryKey: ['shortage-materials'],
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    queryFn: async ({ pageParam = 1 }) => {
      const pageNumber =
        typeof pageParam === 'number' ? pageParam : Number(pageParam) || 1;
      const response = await getMaterialList({
        status: 'shortage',
        page: pageNumber,
        page_size: shortagePageSize,
      });

      if (!response.success || !response.data) {
        return { items: [], totalCount: 0, nextPage: null };
      }

      const items = response.data.data || [];
      const totalCount =
        response.data.totalCnt ?? response.data.count ?? items.length ?? 0;
      const currentPage = response.data.curPage ?? pageNumber;
      const totalPages =
        response.data.pageCnt ??
        Math.max(1, Math.ceil(totalCount / shortagePageSize));
      const nextPage =
        response.data.nextPage ??
        (currentPage < totalPages ? currentPage + 1 : null);

      return {
        items,
        totalCount,
        nextPage,
      };
    },
  });

  const materials = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );
  const displayMaterials = useMemo(() => {
    if (limit && materials.length > limit) {
      return materials.slice(0, limit);
    }
    return materials;
  }, [materials, limit]);
  const totalCount = data?.pages[0]?.totalCount ?? materials.length ?? 0;
  const isInitialLoading = isLoading && materials.length === 0;
  const showMoreButton = Boolean(limit && materials.length > limit);

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

  const shouldHideSection =
    hideWhenEmpty && !isInitialLoading && materials.length === 0;
  if (shouldHideSection) {
    return null;
  }

  const renderContent = () => {
    if (isInitialLoading) {
      return <></>;
    }

    if (displayMaterials.length === 0) {
      return (
        <div className="px-6 pt-4">
          <NoHistoryBox text={tAlarm('noRopNotifications')} />
        </div>
      );
    }

    return (
      <>
        {displayMaterials.map((material) => {
          const unitLabel = material.unit ? ` ${material.unit}` : '';
          const formatValueWithUnit = (value?: number) => {
            const formatted = formatStockValue(value);
            return formatted === '-' ? formatted : `${formatted}${unitLabel}`;
          };

          return (
            <AlarmItem
              key={material.id}
              chipText={tAlarm('materialShortage')}
              chipVariant="red-secondary"
              name={material.name}
              subText={`${formatValueWithUnit(material.current_stock)} / ${formatValueWithUnit(material.standard_stock)}`}
              onClick={() => {
                router.push(`/material/${material.id}`);
              }}
            />
          );
        })}
        {showMoreButton && (
          <div className="px-4 py-2">
            <MoBtn
              text={tAlarm('viewMore')}
              variant="outline"
              icon={<CaretRight />}
              width="w-full"
              onClick={() => router.push('/alarm?tab=rop')}
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

  return (
    <>
      <div className="flex flex-col gap-1 pt-4">
        <Title icon={<MoneyWavy />} title={t('rop')} count={totalCount} />
        {content}
      </div>
    </>
  );
};

export default Rop;
