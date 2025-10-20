import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import Chip from '@/ui/chip';
import IconBtn from '@/ui/icon-btn';
import { PencilSimple, Trash } from '@phosphor-icons/react';

interface MaterialPackagingItemProps {
  setIsMaterialPackagingDetailModalOpen: (v: boolean) => void;
}

export const MaterialPackagingItem = ({
  setIsMaterialPackagingDetailModalOpen,
}: MaterialPackagingItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex items-center h-14 border-b border-lg hover:border hover:border-primary Me_Body-1 group cursor-default">
      <div className="flex-[0.8] px-3">
        <Chip text="사용중" textColor="text-primary" bgColor="bg-primary-8" />
      </div>
      <p className="flex-[1.5] px-3 text-dg truncate" title="LOT-20251019-01">
        LOT-20251019-01
      </p>
      <p
        className="flex-[1.5] px-3 text-dg truncate"
        title="LOT-20251019-01-01"
      >
        LOT-20251019-01-01
      </p>
      <p className="flex-1 px-3 text-dg truncate" title="200EA">
        200EA
      </p>
      <p className="flex-1 px-3 text-dg truncate" title="창고1-랙A">
        창고1-랙A
      </p>
      <p className="flex-1 px-3 text-dg">-</p>

      {!isViewer && hasSubscription() && (
        <div className="flex-1 flex gap-2.5 px-3">
          <IconBtn
            icon={PencilSimple}
            size="w-9 h-9"
            iconSize={16}
            onClick={() => {
              setIsMaterialPackagingDetailModalOpen(true);
            }}
          />
          <IconBtn
            icon={Trash}
            size="w-9 h-9"
            iconSize={16}
            onClick={() => {}}
          />
        </div>
      )}
    </div>
  );
};
