import Chip from '@/ui/chip'
import { EquipmentResponseModel } from '@/types/data-model'
import { EquipmentStatusType, EquipmentStatusColorMap } from '@/types/status-type'
import Checkbox from '@/ui/checkbox'

export interface FacilityTableItemProps {
  facility: EquipmentResponseModel
  onClick?: () => void
  isChecked?: boolean
  onToggle?: () => void
}

const FacilityTableItem = ({ facility, onClick, isChecked, onToggle }: FacilityTableItemProps) => {
  const statusColor = facility.status
    ? EquipmentStatusColorMap[facility.status as EquipmentStatusType]
    : EquipmentStatusColorMap['가동 대기']

  return (
    <div
      className="flex h-14 items-center px-3 w-full border-b border-[#eeeeee] Me_Body-1 text-dg hover:bg-bg transition-colors duration-200 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.()
      }}
    >
      <Checkbox isChecked={isChecked || false} onToggle={onToggle || (() => {})} />
      <div className="flex-1 px-3">
        <Chip
          text={facility.status as EquipmentStatusType}
          bgColor={statusColor?.bgColor}
          textColor={statusColor?.textColor}
          radius="rounded-sm"
        />
      </div>
      <p className="flex-1 px-3">{facility.name}</p>
      <p className="flex-1 px-3">{facility.priority.toLocaleString()}</p>
      <p className="flex-2 px-3">{facility.location}</p>
    </div>
  )
}

export default FacilityTableItem
