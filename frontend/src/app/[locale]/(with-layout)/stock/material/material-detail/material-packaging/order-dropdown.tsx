import { Dropdown, DropdownItem } from '@/ui';
import React from 'react';

interface OrderDropdownProps {
  onClose: () => void;
  onSelectOrder: (order: 'expiration_date' | 'lot_number') => void;
}

const OrderDropdown = ({ onClose, onSelectOrder }: OrderDropdownProps) => {
  return (
    <Dropdown onClose={onClose} width="w-[150px]">
      <DropdownItem
        text="임박 순"
        onClick={() => {
          onSelectOrder('expiration_date');
        }}
      />
      <DropdownItem
        text="입고 순"
        onClick={() => {
          onSelectOrder('lot_number');
        }}
      />
    </Dropdown>
  );
};

export default OrderDropdown;
