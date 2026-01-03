import { Dropdown, DropdownItem } from '@/ui';
import { useTranslations } from 'next-intl';
import React from 'react';

interface OrderDropdownProps {
  onClose: () => void;
  onSelectOrder: (order: 'expiration_date' | 'lot_number') => void;
}

const OrderDropdown = ({ onClose, onSelectOrder }: OrderDropdownProps) => {
  const t = useTranslations('stock.material.packaging.orderBy');

  return (
    <Dropdown onClose={onClose} width="w-[150px]">
      <DropdownItem
        text={t('expirationDate')}
        onClick={() => {
          onSelectOrder('expiration_date');
        }}
      />
      <DropdownItem
        text={t('lotNumber')}
        onClick={() => {
          onSelectOrder('lot_number');
        }}
      />
    </Dropdown>
  );
};

export default OrderDropdown;
