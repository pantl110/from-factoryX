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
          bgColor={color['가동 대기'].bgColor}
          textColor={color['가동 대기'].textColor}
          onClick={(e) => {
            e?.stopPropagation();
            onStatusChange('가동 대기');
            onClose();
          }}
          hover={color['가동 대기'].hover}
        />
      </DropdownItem>
      <DropdownItem noHover={true} chip={true}>
        <Chip
          text="가동 중"
          bgColor={color['가동 중'].bgColor}
          textColor={color['가동 중'].textColor}
          onClick={(e) => {
            e?.stopPropagation();
            onStatusChange('가동 중');
            onClose();
          }}
          hover={color['가동 중'].hover}
        />
      </DropdownItem>
      <DropdownItem noHover={true} chip={true}>
        <Chip
          text="가동 완료"
          bgColor={color['가동 완료'].bgColor}
          textColor={color['가동 완료'].textColor}
          onClick={(e) => {
            e?.stopPropagation();
            onStatusChange('가동 완료');
            onClose();
          }}
          hover={color['가동 완료'].hover}
        />
      </DropdownItem>
    </Dropdown>
  );
};

export default OperationStatusDropdown;
