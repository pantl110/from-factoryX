import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { AccountsStatusColorMap, AccountsStatusMap } from '@/types/status-type';
import { AccountsStatusType } from '@/types/status-type';

interface AccountStatusDropdownProps {
  onClose: () => void;
  onSelect: (status: string | undefined) => void;
  width: string;
}

const AccountStatusDropdown = ({
  onClose,
  onSelect,
  width,
}: AccountStatusDropdownProps) => {
  const statusOptions: Array<{
    label: string;
    value: AccountsStatusType | undefined;
    textColor: string;
  }> = [
    { label: '전체', value: undefined, textColor: 'text-dg' },
    {
      label: AccountsStatusMap.overdue,
      value: 'overdue',
      textColor: AccountsStatusColorMap.overdue.textColor || 'text-red',
    },
    {
      label: AccountsStatusMap.partial,
      value: 'partial',
      textColor: AccountsStatusColorMap.partial.textColor || 'text-orange',
    },
    {
      label: AccountsStatusMap.waiting,
      value: 'waiting',
      textColor: AccountsStatusColorMap.waiting.textColor || 'text-dg',
    },
    {
      label: AccountsStatusMap.completed,
      value: 'completed',
      textColor: AccountsStatusColorMap.completed.textColor || 'text-primary',
    },
  ];

  return (
    <Dropdown onClose={onClose} width={width}>
      {statusOptions.map((option) => (
        <DropdownItem
          key={option.label}
          text={option.label}
          textColor={option.textColor}
          onClick={() => {
            onSelect(option.value);
            onClose();
          }}
        />
      ))}
    </Dropdown>
  );
};

export default AccountStatusDropdown;
