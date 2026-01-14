import { useMemo } from 'react';
import { CalendarDots, CaretRight } from '@phosphor-icons/react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Title from '../title';
import AlarmItem from '../alarm-item';
import { MoBtn, NoHistoryBox, Spinner } from '@/ui';
import { useInfiniteScroll } from '@/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';
import axios from 'axios';
import {
  ExpiryRiskMaterialListResponseModel,
  ExpiryRiskMaterialModel,
} from '@/types/data-model';

interface ExpiryProps {
  hideWhenEmpty?: boolean;
  limit?: number;
}

const formatStockValue = (value?: number) =>
  typeof value === 'number' ? value.toLocaleString() : '-';

const expiryPageSize = 10;

const Expiry = ({ hideWhenEmpty = false, limit }: ExpiryProps) => {
  const t = useTranslations('mobile.alarm.tabs');
  const tAlarm = useTranslations('mobile.alarm');
  const router = useRouter();
  const factoryId = useMemberStore((state) => state.factoryId);
  const {
    data,
    fetchNextPage,
    hasNextPage = false,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery<{
    items: ExpiryRiskMaterialModel[];
    totalCount: number;
    nextPage: number | null;
  }>({
    queryKey: ['expiry-risk-materials', factoryId],
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
        await axios.get<ExpiryRiskMaterialListResponseModel>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/expiry-risk`,
          {
            params: {
              factory_id: factoryId,
              page: pageNumber,
              page_size: expiryPageSize,
            },
            withCredentials: true,
          }
        );

      const items: ExpiryRiskMaterialModel[] = result.data || [];
      const totalCount = result.totalCnt ?? result.count ?? items.length ?? 0;
      const currentPage = result.curPage ?? pageNumber;
      const totalPages =
        result.pageCnt ?? Math.max(1, Math.ceil(totalCount / expiryPageSize));
      const nextPage =
        result.nextPage ?? (currentPage < totalPages ? currentPage + 1 : null);

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
    if (!Array.isArray(materials)) {
      return [];
    }
    if (limit && materials.length > limit) {
      return materials.slice(0, limit);
    }
    return materials;
  }, [materials, limit]);

  const totalCount = data?.pages[0]?.totalCount ?? materials.length ?? 0;
  const isInitialLoading = isLoading && materials.length === 0;
  const showMoreButton = Boolean(limit && materials.length > limit);
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

  const shouldHideSection =
    hideWhenEmpty && !isInitialLoading && materials.length === 0;
  if (shouldHideSection) {
    return null;
  }

  const renderContent = () => {
    // 로딩 중일 때는 아무것도 표시하지 않음 (이미 위에서 Spinner 처리됨)
    if (isLoading || errorMessage) {
      return null;
    }

    // 데이터가 없을 때만 NoHistoryBox 표시
    if (!Array.isArray(displayMaterials) || displayMaterials.length === 0) {
      return (
        <div className="px-6 pt-4">
          <NoHistoryBox text={tAlarm('noExpiryNotifications')} />
        </div>
      );
    }

    return (
      <>
        {displayMaterials.map((material) => {
          const unit = material.unit ? ` ${material.unit}` : '';
          const formatValueWithUnit = (value?: number) => {
            const formatted = formatStockValue(value);
            return formatted === '-' ? formatted : `${formatted}${unit}`;
          };
          const currentStock = formatValueWithUnit(material.current_stock);
          const rop = formatValueWithUnit(material.rop);
          const subText = `${currentStock} / ${rop}`;

          return (
            <AlarmItem
              key={material.id}
              chipText={tAlarm('expiryRisk')}
              chipVariant="red-secondary"
              name={material.name}
              subText={subText}
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
              onClick={() => router.push('/alarm?tab=expiry')}
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
        <Title icon={<CalendarDots />} title={t('expiry')} count={totalCount} />
        {content}
      </div>
    </>
  );
};

export default Expiry;
