'use client';

import { Dropdown, DropdownItem } from '@/ui';
import { useTranslations } from 'next-intl';

interface DeliveryFilterDropdownProps {
  onSelect: (filter: string) => void;
  onClose: () => void;
}

const DeliveryFilterDropdown = ({
  onSelect,
  onClose,
}: DeliveryFilterDropdownProps) => {
  const t = useTranslations('mobile.alarm.filter');

  return (
    <Dropdown onClose={onClose} width="w-fit min-w-30">
      <DropdownItem
        text={t('today')}
        onClick={() => {
          onSelect(t('today'));
          onClose();
        }}
      />
      <DropdownItem
        text={t('delayed')}
        onClick={() => {
          onSelect(t('delayed'));
          onClose();
        }}
      />
      <DropdownItem
        text={t('scheduled')}
        onClick={() => {
          onSelect(t('scheduled'));
          onClose();
        }}
      />
    </Dropdown>
  );
};

export default DeliveryFilterDropdown;
