import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { MiniBtn } from '@/ui';
import { MaterialHistoryResponseModel } from '@/types/data-model';
import { convertUTCToKSTDate } from '@/utils';
import { getExpiryClassName } from '../utils';

interface MaterialStockInItemProps {
  history: MaterialHistoryResponseModel;
  setIsMaterialPackagingDetailModalOpen: (
    repackagingId?: number,
    nextRepackagingLotNumber?: string
  ) => void;
  expiryWarningDays?: number | null;
}

export const MaterialStockInItem = ({
  history,
  setIsMaterialPackagingDetailModalOpen,
  expiryWarningDays,
}: MaterialStockInItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 group cursor-default">
      <p className="flex-[1.5] px-3 text-dg">{history.lot_number || '-'}</p>
      <p className="flex-1 px-3 text-dg">
        {convertUTCToKSTDate(history.date) || '-'}
      </p>
      <p
        className="flex-1 px-3 text-primary truncate"
        title={`+${history.quantity.toLocaleString()}${history.material_unit}`}
      >
        {`+${history.quantity.toLocaleString()}${history.material_unit}`}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={
          history.remaining_quantity
            ? `${history.remaining_quantity.toLocaleString()}${history.material_unit}`
            : '-'
        }
      >
        {history.remaining_quantity
          ? `${history.remaining_quantity.toLocaleString()}${history.material_unit}`
          : '-'}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={history.warehouse_location || '-'}
      >
        {history.warehouse_location || '-'}
      </p>
      <p
        className={`flex-1 px-3 ${getExpiryClassName({
          target: history,
          warningDays: expiryWarningDays,
        })}`}
      >
        {history.expiration_date
          ? convertUTCToKSTDate(history.expiration_date) || '-'
          : '-'}
      </p>

      {!isViewer && hasSubscription() && (
        <div className="flex-1 px-3">
          <MiniBtn
            text="소분"
            variant="whiteOutline"
            height="h-8"
            padding="px-3"
            textStyle="Re_body-2"
            onClick={() => {
              setIsMaterialPackagingDetailModalOpen(
                undefined,
                history.next_repackaging_lot_number
                  ? history.next_repackaging_lot_number
                  : undefined
              );
            }}
          />
        </div>
      )}
    </div>
  );
};
