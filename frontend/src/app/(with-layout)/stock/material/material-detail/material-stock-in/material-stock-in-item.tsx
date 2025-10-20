import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import MiniBtn from '@/ui/mini-btn';

export const MaterialStockInItem = () => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex items-center h-14 border-b border-lg hover:border hover:border-primary Me_Body-1 group cursor-default">
      <p className="flex-[1.5] px-3 text-dg">LOT-20251019-01</p>
      <p className="flex-1 px-3 text-dg">2025-10-19</p>
      <p className="flex-1 px-3 text-primary truncate" title="+1000EA">
        +1000EA
      </p>
      <p className="flex-1 px-3 text-dg truncate" title="창고1-랙A">
        창고1-랙A
      </p>
      <p className="flex-1 px-3 text-dg">-</p>

      {!isViewer && hasSubscription() && (
        <div className="flex-1 px-3">
          <MiniBtn
            text="소분"
            variant="whiteOutline"
            height="h-8"
            padding="px-3"
            textStyle="Re_body-2"
            onClick={() => {}}
          />
        </div>
      )}
    </div>
  );
};
