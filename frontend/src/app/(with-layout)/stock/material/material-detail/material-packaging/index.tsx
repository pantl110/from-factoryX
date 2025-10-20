import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { MaterialPackagingItem } from './material-packaging-item';

interface MaterialPackagingProps {
  setIsMaterialPackagingDetailModalOpen: (v: boolean) => void;
}

export const MaterialPackaging = ({
  setIsMaterialPackagingDetailModalOpen,
}: MaterialPackagingProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 flex items-center justify-between">
        <h3 className="Heading-3 text-dg">원자재 소분 내역</h3>
      </div>

      {/* 표 헤더 부분 */}
      <div className="flex flex-col">
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
          <p className="flex-[0.8] px-3 text-sv">상태</p>
          <p className="flex-[1.5] px-3 text-sv">부모 LOT 번호</p>
          <p className="flex-[1.5] px-3 text-sv">소분 LOT 번호</p>
          <p className="flex-1 px-3 text-sv">수량</p>
          <p className="flex-1 px-3 text-sv">창고 위치</p>
          <p className="flex-1 px-3 text-sv">유통기한</p>
          {!isViewer && hasSubscription() && (
            <p className="flex-1 px-3 text-sv">액션</p>
          )}
        </div>

        <MaterialPackagingItem
          setIsMaterialPackagingDetailModalOpen={
            setIsMaterialPackagingDetailModalOpen
          }
        />
        {/* 페이지네이션 필요 */}
      </div>
    </div>
  );
};
