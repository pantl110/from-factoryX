import { EquipmentResponseModel } from '@/types/data-model';
import { EquipmentStatusType } from '@/types/status-type';
import { RoundChip } from '@/ui';
import Checkbox from '@/ui/checkbox';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

export interface FacilityTableItemProps {
  facility: EquipmentResponseModel;
  onClick?: () => void;
  isChecked?: boolean;
  onToggle?: () => void;
}

const FacilityTableItem = ({
  facility,
  onClick,
  isChecked,
  onToggle,
}: FacilityTableItemProps) => {
  const tFacility = useTranslations(
    'setting.masterData.facility.detailPanel.status'
  );
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  // RoundChip용 색상 매핑
  const getEquipmentStatusRoundChipColor = (
    status: EquipmentStatusType | undefined
  ): 'gray' | 'purple' => {
    if (status === 'running') return 'purple';
    return 'gray';
  };

  return (
    <div
      className="flex h-14 items-center px-3 w-full border-b border-lg Me_Body-1 text-dg hover:bg-bg transition-colors duration-200 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      {!isViewer && hasSubscription() && (
        <Checkbox
          isChecked={isChecked || false}
          onToggle={onToggle || (() => {})}
        />
      )}
      <div className="flex-1 px-3">
        <RoundChip
          text={
            facility.status === 'standby'
              ? tFacility('standby')
              : tFacility('running')
          }
          variant="sm"
          color={getEquipmentStatusRoundChipColor(
            facility.status as EquipmentStatusType | undefined
          )}
        />
      </div>
      <p className="flex-1 px-3 truncate" title={facility.name}>
        {facility.name}
      </p>
      <p className="flex-1 px-3">{facility.priority.toLocaleString()}</p>
      <p className="flex-2 px-3 truncate" title={facility.location || '-'}>
        {facility.location || '-'}
      </p>
    </div>
  );
};

export default FacilityTableItem;
