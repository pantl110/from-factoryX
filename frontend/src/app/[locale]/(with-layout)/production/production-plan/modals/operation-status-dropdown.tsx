import { useTranslations } from 'next-intl';
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
  const t = useTranslations('production.operationStatus');
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
          text={t('pending')}
          bgColor={color.pending.bgColor}
          textColor={color.pending.textColor}
          onClick={(e) => {
            e?.stopPropagation();
            onStatusChange('pending');
            onClose();
          }}
          hover={color.pending.hover}
          cursor="cursor-pointer"
        />
      </DropdownItem>
      {/* <DropdownItem noHover={true} chip={true}>
        <Chip
          text={t('production')}
          bgColor={color.production.bgColor}
          textColor={color.production.textColor}
          onClick={(e) => {
            e?.stopPropagation();
            onStatusChange('production');
            onClose();
          }}
          hover={color.production.hover}
          cursor="cursor-pointer"
        />
      </DropdownItem> */}
      <DropdownItem noHover={true} chip={true}>
        <Chip
          text={t('completed')}
          bgColor={color.completed.bgColor}
          textColor={color.completed.textColor}
          onClick={(e) => {
            e?.stopPropagation();
            onStatusChange('completed');
            onClose();
          }}
          hover={color.completed.hover}
          cursor="cursor-pointer"
        />
      </DropdownItem>
    </Dropdown>
  );
};

export default OperationStatusDropdown;
