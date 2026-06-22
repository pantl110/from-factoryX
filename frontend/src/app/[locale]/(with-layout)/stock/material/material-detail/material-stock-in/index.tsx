import { useState } from 'react';
import { useTranslations } from 'next-intl';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { MaterialStockInItem } from './material-stock-in-item';
import { useQuery } from '@tanstack/react-query';
import { getMaterialHistoryQueryFn, getMaterialHistoryQueryKey } from '@/hooks';
import { NoHistoryBox } from '@/ui';
import Pagination from '@/components/pagination';

interface MaterialStockInProps {
  materialId: number;
  setIsMaterialPackagingDetailModalOpen: (
    repackagingId?: number,
    nextRepackagingLotNumber?: string,
    parentHistoryId?: number
  ) => void;
  onEditClick?: (historyId: number) => void;
  expiryWarningDays?: number | null;
}

const PAGE_SIZE = 5;

export const MaterialStockIn = ({
  materialId,
  setIsMaterialPackagingDetailModalOpen,
  onEditClick,
  expiryWarningDays,
}: MaterialStockInProps) => {
  const t = useTranslations('stock.material.stockIn');
  const tCommon = useTranslations('common');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  const factoryId = useMemberStore((state) => state.factoryId);
  const [currentPage, setCurrentPage] = useState(1);

  // 구매 타입의 material history만 가져오기
  const { data: histories, isLoading } = useQuery({
    queryKey: getMaterialHistoryQueryKey(factoryId, {
      material_id: materialId,
      type: 'purchase',
      page: currentPage,
      page_size: PAGE_SIZE,
    }),
    queryFn: () => {
      if (!factoryId) {
        throw new Error(t('errors.factoryIdNotSet'));
      }
      return getMaterialHistoryQueryFn(factoryId, {
        material_id: materialId,
        type: 'purchase',
        page: currentPage,
        page_size: PAGE_SIZE,
      });
    },
    enabled: !!factoryId,
  });

  const page = histories?.curPage ?? 1;
  const totalPages = histories?.pageCnt ?? 1;
  const historyList = histories?.data ?? [];

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage !== page) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 flex items-center justify-between">
        <h3 className="Heading-3 text-dg">{t('title')}</h3>
      </div>

      {/* 표 헤더 부분 */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="h-50" />
        ) : historyList.length > 0 ? (
          <>
            <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 cursor-default">
              <p className="flex-[2] px-3 text-sv">
                {t('tableHeader.lotNumber')}
              </p>
              <p className="flex-1 px-3 text-sv">
                {t('tableHeader.stockInQuantity')}
              </p>
              <p className="flex-1 px-3 text-sv">
                {t('tableHeader.remainingQuantity')}
              </p>
              <p className="flex-1 px-3 text-sv">
                {tCommon('warehouseLocation')}
              </p>
              <p className="flex-1 px-3 text-sv">{tCommon('expirationDate')}</p>
              {!isViewer && hasSubscription() && (
                <p className="w-20 px-3 text-sv">{tCommon('action')}</p>
              )}
            </div>
            {historyList.map((history) => (
              <MaterialStockInItem
                key={history.id}
                history={history}
                setIsMaterialPackagingDetailModalOpen={
                  setIsMaterialPackagingDetailModalOpen
                }
                onEditClick={() => onEditClick?.(history.id)}
                expiryWarningDays={expiryWarningDays}
              />
            ))}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <NoHistoryBox
            title={t('empty.title')}
            text={t('empty.description')}
          />
        )}
      </div>
    </div>
  );
};
