'use client';

import { Dropdown, DropdownItem } from '@/ui';
import { AccountsStatusColorMap } from '@/types/status-type';
import { useTranslations } from 'next-intl';

interface AccountFilterDropdownProps {
  onSelect: (filter: string) => void;
  onClose: () => void;
}

const AccountFilterDropdown = ({
  onSelect,
  onClose,
}: AccountFilterDropdownProps) => {
  const tList = useTranslations('tax.list');
  const tCommon = useTranslations('common');
  const filterOptions: Array<{ label: string; textColor: string }> = [
    { label: tCommon('all'), textColor: 'text-dg' },
    {
      label: tList('status.overdue'),
      textColor: AccountsStatusColorMap.overdue.textColor || 'text-red',
    },
    {
      label: tList('status.partial'),
      textColor: AccountsStatusColorMap.partial.textColor || 'text-orange',
    },
    {
      label: tList('status.waiting'),
      textColor: AccountsStatusColorMap.waiting.textColor || 'text-dg',
    },
    {
      label: tList('status.completed'),
      textColor: AccountsStatusColorMap.completed.textColor || 'text-primary',
    },
  ];

  return (
    <Dropdown onClose={onClose} width="w-fit min-w-30">
      {filterOptions.map((option) => (
        <DropdownItem
          key={option.label}
          text={option.label}
          textColor={option.textColor}
          onClick={() => {
            onSelect(option.label);
            onClose();
          }}
        />
      ))}
    </Dropdown>
  );
};

export default AccountFilterDropdown;
