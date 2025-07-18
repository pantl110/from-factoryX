import Chip from '@/ui/chip';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import React from 'react';

interface ProductStockLogDropdownProps {
  onClose: () => void;
  onSelect: (value: string) => void;
}

const ProductStockLogDropdown = ({
  onClose,
  onSelect,
}: ProductStockLogDropdownProps) => {
  return (
    <Dropdown onClose={onClose} width="w-fit">
      <DropdownItem noHover={true} onClick={() => onSelect('1개월')}>
        <div className="cursor-pointer">
          <Chip
            text="1개월"
            bgColor="bg-wh"
            textColor="text-dg"
            borderColor="border-lg"
            height="h-9"
            width="w-20"
            padding="px-2"
          />
        </div>
      </DropdownItem>
      <DropdownItem noHover={true} onClick={() => onSelect('3개월')}>
        <div className="cursor-pointer">
          <Chip
            text="3개월"
            bgColor="bg-wh"
            textColor="text-dg"
            borderColor="border-lg"
            height="h-9"
            width="w-20"
            padding="px-2"
          />
        </div>
      </DropdownItem>
      <DropdownItem noHover={true} onClick={() => onSelect('6개월')}>
        <div className="cursor-pointer">
          <Chip
            text="6개월"
            bgColor="bg-wh"
            textColor="text-dg"
            borderColor="border-lg"
            height="h-9"
            width="w-20"
            padding="px-2"
          />
        </div>
      </DropdownItem>
      <DropdownItem noHover={true} onClick={() => onSelect('1년')}>
        <div className="cursor-pointer">
          <Chip
            text="1년"
            bgColor="bg-wh"
            textColor="text-dg"
            borderColor="border-lg"
            height="h-9"
            width="w-20"
            padding="px-2"
          />
        </div>
      </DropdownItem>
      <DropdownItem noHover={true} onClick={() => onSelect('직접 설정')}>
        <div className="cursor-pointer">
          <Chip
            text="직접 설정"
            bgColor="bg-wh"
            textColor="text-dg"
            borderColor="border-lg"
            height="h-9"
            width="w-20"
            padding="px-2"
          />
        </div>
      </DropdownItem>
    </Dropdown>
  );
};

export default ProductStockLogDropdown;
