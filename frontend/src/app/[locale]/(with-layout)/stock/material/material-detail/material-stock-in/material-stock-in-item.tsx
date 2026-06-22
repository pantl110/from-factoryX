import { useTranslations } from 'next-intl';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { IconBtn, MiniBtn } from '@/ui';
import { MaterialHistoryResponseModel } from '@/types/data-model';
import { formatISODate, removeTrailingZeros } from '@/utils';
import { getExpiryClassName } from '../utils';
import { PencilSimple } from '@phosphor-icons/react';

interface MaterialStockInItemProps {
  history: MaterialHistoryResponseModel;
  setIsMaterialPackagingDetailModalOpen: (
    repackagingId?: number,
    nextRepackagingLotNumber?: string,
    parentHistoryId?: number
  ) => void;
  onEditClick?: () => void;
  expiryWarningDays?: number | null;
}

export const MaterialStockInItem = ({
  history,
  setIsMaterialPackagingDetailModalOpen,
  onEditClick,
  expiryWarningDays,
}: MaterialStockInItemProps) => {
  const t = useTranslations('stock.material.stockIn');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-3 group cursor-default">
      <div className="flex-[2] px-3 flex items-center justify-between">
        <p className="text-dg">{history.lot_number || '-'}</p>
        {!isViewer && hasSubscription() && (
          <MiniBtn
            text={t('repackagingButton')}
            variant="outline"
            height="h-8"
            padding="px-3"
            textStyle="Re_body-2"
            onClick={() => {
              setIsMaterialPackagingDetailModalOpen(
                undefined,
                history.next_repackaging_lot_number
                  ? history.next_repackaging_lot_number
                  : undefined,
                history.id
              );
            }}
          />
        )}
      </div>
      <p
        className="flex-1 px-3 text-blue truncate"
        title={`+${removeTrailingZeros(history.quantity)}`}
      >
        {`+${removeTrailingZeros(history.quantity)}`}
      </p>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={
          history.remaining_quantity
            ? `${removeTrailingZeros(history.remaining_quantity)}`
            : '-'
        }
      >
        {history.remaining_quantity
          ? `${removeTrailingZeros(history.remaining_quantity)}`
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
          ? formatISODate(history.expiration_date) || '-'
          : '-'}
      </p>

      {!isViewer && hasSubscription() && (
        <div className="w-20 px-3">
          <IconBtn
            icon={PencilSimple}
            size="w-9 h-9"
            iconSize={16}
            hoverBg={false}
            hoverText="text-primary"
            onClick={() => onEditClick?.()}
          />
        </div>
      )}
    </div>
  );
};
