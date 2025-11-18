import { useMemo } from 'react';
import { CaretRight, MoneyWavy } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import Title from '../title';
import AlarmItem from '../alarm-item';
import { MaterialResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import { useInfiniteScroll, useGetMaterial } from '@/hooks';
import MoBtn from '@/ui/mo-btn';

interface RopProps {
  hideWhenEmpty?: boolean;
  withDivider?: boolean;
  limit?: number;
}

const formatStockValue = (value?: number) =>
  typeof value === 'number' ? value.toLocaleString() : '-';

const shortagePageSize = 10;

const Rop = ({
  hideWhenEmpty = false,
  withDivider = false,
  limit,
}: RopProps) => {
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
          <NoHistoryBox text="ROP 알림이 없어요." />
        </div>
      );
    }

    return (
      <>
        {displayMaterials.map((material) => {
          const unitLabel = material.unit ? ` ${material.unit}` : '';

          return (
            <AlarmItem
              key={material.id}
              chipText="자재가 부족해요!"
              chipVariant="red-secondary"
              name={material.name}
              subText={`${formatStockValue(material.current_stock)}${unitLabel} / ${formatStockValue(material.standard_stock)}${unitLabel}`}
              onClick={() => {
                router.push(`/material/${material.id}`);
              }}
            />
          );
        })}
        {showMoreButton && (
          <div className="px-4 py-2">
            <MoBtn
              text="더 보기"
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
        <Title icon={<MoneyWavy />} title="ROP" count={totalCount} />
        {content}
      </div>
      {withDivider && <div className="h-1 bg-bg" />}
    </>
  );
};

export default Rop;
