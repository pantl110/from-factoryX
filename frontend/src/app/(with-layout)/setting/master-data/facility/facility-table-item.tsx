import Chip from '@/ui/chip';
import { EquipmentResponseModel } from '@/types/data-model';
import {
  EquipmentStatusType,
  EquipmentStatusColorMap,
} from '@/types/status-type';
import Checkbox from '@/ui/checkbox';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

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
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const statusColor = facility.status
    ? EquipmentStatusColorMap[facility.status as EquipmentStatusType]
    : EquipmentStatusColorMap['standby'];

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
        <Chip
          text={facility.status === 'standby' ? '가동 대기' : '가동 중'}
          bgColor={statusColor?.bgColor}
          textColor={statusColor?.textColor}
          radius="rounded-sm"
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
