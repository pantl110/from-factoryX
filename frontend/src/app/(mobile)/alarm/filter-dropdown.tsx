'use client';

import { Dropdown, DropdownItem } from '@/ui';

interface FilterDropdownProps {
  onSelect: (filter: string) => void;
  onClose: () => void;
}

const FilterDropdown = ({ onSelect, onClose }: FilterDropdownProps) => {
  return (
    <Dropdown onClose={onClose} width="w-30">
      <DropdownItem
        text="오늘"
        onClick={() => {
          onSelect('오늘');
          onClose();
        }}
      />
      <DropdownItem
        text="지연"
        onClick={() => {
          onSelect('지연');
          onClose();
        }}
      />
      <DropdownItem
        text="예정"
        onClick={() => {
          onSelect('예정');
          onClose();
        }}
      />
    </Dropdown>
  );
};

export default FilterDropdown;
