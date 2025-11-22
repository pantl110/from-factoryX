import { useState } from 'react';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { MaterialStockInItem } from './material-stock-in-item';
import { useQuery } from '@tanstack/react-query';
import { getMaterialHistoryQueryFn, getMaterialHistoryQueryKey } from '@/hooks';
import { NoHistoryBox } from '@/ui';
import Pagination from '@/components/pagination';

interface MaterialStockInProps {
  materialId: number;
  setIsMaterialPackagingDetailModalOpen: (mode: 'create' | 'update') => void;
}

const PAGE_SIZE = 5;

export const MaterialStockIn = ({
  materialId,
  setIsMaterialPackagingDetailModalOpen,
}: MaterialStockInProps) => {
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
        throw new Error('공장 ID가 설정되지 않았습니다.');
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
        <h3 className="Heading-3 text-dg">원자재 입고 및 LOT 추적</h3>
      </div>

      {/* 표 헤더 부분 */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="h-50" />
        ) : historyList.length > 0 ? (
          <>
            <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
              <p className="flex-[1.5] px-3 text-sv">LOT 번호</p>
              <p className="flex-1 px-3 text-sv">입고일</p>
              <p className="flex-1 px-3 text-sv">입고 수량</p>
              <p className="flex-1 px-3 text-sv">남은 수량</p>
              <p className="flex-1 px-3 text-sv">창고 위치</p>
              <p className="flex-1 px-3 text-sv">유통기한</p>
              {!isViewer && hasSubscription() && (
                <p className="flex-1 px-3 text-sv">액션</p>
              )}
            </div>
            {historyList.map((history) => (
              <MaterialStockInItem
                key={history.id}
                history={history}
                setIsMaterialPackagingDetailModalOpen={
                  setIsMaterialPackagingDetailModalOpen
                }
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
            title="아직 등록된 입고 내역이 없어요."
            text="입고 내역이 등록되면 이곳에서 확인할 수 있어요."
          />
        )}
      </div>
    </div>
  );
};
