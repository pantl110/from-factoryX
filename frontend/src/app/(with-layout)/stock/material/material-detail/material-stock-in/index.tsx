import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { MaterialStockInItem } from './material-stock-in-item';

export const MaterialStockIn = () => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 flex items-center justify-between">
        <h3 className="Heading-3 text-dg">원자재 입고 및 LOT 추적</h3>
      </div>

      {/* 표 헤더 부분 */}
      <div className="flex flex-col">
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

        <MaterialStockInItem />

        {/* 페이지네이션 필요 */}
      </div>
    </div>
  );
};
