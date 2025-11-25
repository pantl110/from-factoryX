import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import IconBtn from '@/ui/icon-btn';
import { PencilSimple, Trash } from '@phosphor-icons/react';
import { MaterialRepackagingResponseModel } from '@/types/data-model';
import { convertUTCToKSTDate } from '@/utils';
import { getExpiryClassName } from '../utils';

interface MaterialPackagingItemProps {
  repackaging: MaterialRepackagingResponseModel;
  setIsMaterialPackagingDetailModalOpen: (repackagingId: number) => void;
  onDelete: () => void;
  expiryWarningDays?: number | null;
}

export const MaterialPackagingItem = ({
  repackaging,
  setIsMaterialPackagingDetailModalOpen,
  onDelete,
  expiryWarningDays,
}: MaterialPackagingItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  // 소분 LOT 번호에서 마지막 -00을 제거하면 부모 LOT 번호
  // 예: LOT-20251019-01-01 -> LOT-20251019-01
  const parentLotNumber = repackaging.lot_number.replace(/-\d+$/, '');

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-default">
      {/* <div className="flex-[0.8] px-3">
        <Chip text="사용중" textColor="text-primary" bgColor="bg-primary-8" />
      </div> */}
      <p className="flex-[1.5] px-3 text-dg truncate" title={parentLotNumber}>
        {parentLotNumber}
      </p>
      <p
        className="flex-[1.5] px-3 text-dg truncate"
        title={repackaging.lot_number}
      >
        {repackaging.lot_number}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={`${repackaging.quantity.toLocaleString()}`}
      >
        {repackaging.quantity.toLocaleString()}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={repackaging.warehouse_location || '-'}
      >
        {repackaging.warehouse_location || '-'}
      </p>
      <p
        className={`flex-1 px-3 ${getExpiryClassName({
          target: repackaging,
          warningDays: expiryWarningDays,
        })}`}
      >
        {repackaging.expiration_date
          ? convertUTCToKSTDate(repackaging.expiration_date) || '-'
          : '-'}
      </p>

      {!isViewer && hasSubscription() && (
        <div className="flex-1 flex gap-2.5 px-3">
          <IconBtn
            icon={PencilSimple}
            size="w-9 h-9"
            iconSize={16}
            onClick={() =>
              setIsMaterialPackagingDetailModalOpen(repackaging.id)
            }
          />
          <IconBtn
            icon={Trash}
            size="w-9 h-9"
            iconSize={16}
            onClick={onDelete}
          />
        </div>
      )}
    </div>
  );
};
