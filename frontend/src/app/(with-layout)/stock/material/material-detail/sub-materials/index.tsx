import MiniBtn from '@/ui/mini-btn';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { SubMaterialItem } from './sub-material-item';

export const SubMaterials = () => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 flex items-center justify-between">
        <h3 className="Heading-3 text-dg">대체 가능한 원자재</h3>
        <MiniBtn
          text="연결"
          variant="whiteOutline"
          disabled={isViewer || !hasSubscription()}
          onClick={() => {}}
        />
      </div>

      {/* 표 헤더 부분 */}
      <div className="flex flex-col">
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
          <p className="flex-1 px-3 text-sv">자재명</p>
          <p className="flex-1 px-3 text-sv">자재코드</p>
          <p className="flex-[1.5] px-3 text-sv">LOT 번호</p>
          <p className="flex-1 px-3 text-sv">재고 수량</p>
          <p className="flex-1 px-3 text-sv">재고 상태</p>
          {!isViewer && hasSubscription() && <div className="w-9" />}
        </div>

        <SubMaterialItem />
        {/* 페이지네이션 필요 */}
      </div>
    </div>
  );
};
