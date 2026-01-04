import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { AccountsStatusColorMap } from '@/types/status-type';
import { AccountsStatusType } from '@/types/status-type';
import { useTranslations } from 'next-intl';

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
  const tList = useTranslations('tax.list');
  const tCommon = useTranslations('common');

  const statusOptions: Array<{
    label: string;
    value: AccountsStatusType | undefined;
    textColor: string;
  }> = [
    { label: tCommon('all'), value: undefined, textColor: 'text-dg' },
    {
      label: tList('status.overdue'),
      value: 'overdue',
      textColor: AccountsStatusColorMap.overdue.textColor || 'text-red',
    },
    {
      label: tList('status.partial'),
      value: 'partial',
      textColor: AccountsStatusColorMap.partial.textColor || 'text-orange',
    },
    {
      label: tList('status.waiting'),
      value: 'waiting',
      textColor: AccountsStatusColorMap.waiting.textColor || 'text-dg',
    },
    {
      label: tList('status.completed'),
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
