import { ProductResponseModel } from '@/types/data-model';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import React from 'react';

export const ProductNameDropdown = ({
  items,
  onSelect,
  width,
}: {
  items: ProductResponseModel[];
  onSelect: (item: ProductResponseModel) => void;
  width?: string;
}) => {
  return (
    <Dropdown onClose={() => {}} width={width}>
      {items.slice(0, 6).map((item) => (
        <DropdownItem
          key={item.id}
          text={item.name}
          onClick={() => onSelect(item)}
          search={true}
        />
      ))}
    </Dropdown>
  );
};
