import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { MaterialStockInItem } from './material-stock-in-item';
import { useQuery } from '@tanstack/react-query';
import { getMaterialHistoryQueryFn, getMaterialHistoryQueryKey } from '@/hooks';
import { NoHistoryBox } from '@/ui';

interface MaterialStockInProps {
  materialId: number;
}

export const MaterialStockIn = ({ materialId }: MaterialStockInProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  const factoryId = useMemberStore((state) => state.factoryId);

  // 구매 타입의 material history만 가져오기
  const { data: histories, isLoading } = useQuery({
    queryKey: getMaterialHistoryQueryKey(factoryId, {
      material_id: materialId,
      type: 'purchase',
    }),
    queryFn: () =>
      getMaterialHistoryQueryFn(factoryId!, {
        material_id: materialId,
        type: 'purchase',
      }),
    enabled: !!factoryId,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 flex items-center justify-between">
        <h3 className="Heading-3 text-dg">원자재 입고 및 LOT 추적</h3>
      </div>

      {/* 표 헤더 부분 */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="h-50" />
        ) : histories?.data && histories.data.length > 0 ? (
          histories.data.map((history) => (
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
              <MaterialStockInItem key={history.id} history={history} />
            </>
          ))
        ) : (
          <NoHistoryBox
            title="아직 등록된 입고 내역이 없어요."
            text="입고 내역이 등록되면 이곳에서 확인할 수 있어요."
          />
        )}

        {/* 페이지네이션 필요 */}
      </div>
    </div>
  );
};
