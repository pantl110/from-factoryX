import Chip from '@/ui/chip';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import {
  OperationStatusColorMap,
  OperationStatusType,
} from '@/types/status-type';

interface OperationStatusDropdownProps {
  onClose: () => void;
  onStatusChange: (status: OperationStatusType) => void;
  style?: React.CSSProperties;
}

const OperationStatusDropdown = ({
  onClose,
  onStatusChange,
  style,
}: OperationStatusDropdownProps) => {
  const color = OperationStatusColorMap;

  return (
    <Dropdown
      onClose={onClose}
      width="w-fit"
      style={style}
      padding="p-4"
      gap="gap-2.5"
    >
      <DropdownItem noHover={true} chip={true}>
        <Chip
          text="가동 대기"
          bgColor={color.pending.bgColor}
          textColor={color.pending.textColor}
          onClick={(e) => {
            e?.stopPropagation();
            onStatusChange('pending');
            onClose();
          }}
          hover={color.pending.hover}
        />
      </DropdownItem>
      <DropdownItem noHover={true} chip={true}>
        <Chip
          text="가동 중"
          bgColor={color.production.bgColor}
          textColor={color.production.textColor}
          onClick={(e) => {
            e?.stopPropagation();
            onStatusChange('production');
            onClose();
          }}
          hover={color.production.hover}
        />
      </DropdownItem>
      <DropdownItem noHover={true} chip={true}>
        <Chip
          text="가동 완료"
          bgColor={color.completed.bgColor}
          textColor={color.completed.textColor}
          onClick={(e) => {
            e?.stopPropagation();
            onStatusChange('completed');
            onClose();
          }}
          hover={color.completed.hover}
        />
      </DropdownItem>
    </Dropdown>
  );
};

export default OperationStatusDropdown;
