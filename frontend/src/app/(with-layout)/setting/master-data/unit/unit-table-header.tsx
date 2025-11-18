import { CaretDown } from '@phosphor-icons/react';
import { useState } from 'react';
import SelectProductMaterialDropdown from './modals/select-product-material-dropdown';
import Checkbox from '@/ui/checkbox';

interface UnitTableHeaderProps {
  onCategoryChange?: (category: string) => void;
  selectedCategory: string;
  isAllSelected?: boolean;
  onToggleSelectAll?: () => void;
}

export const UnitTableHeader = ({
  onCategoryChange,
  selectedCategory = '전체',
  isAllSelected = false,
  onToggleSelectAll,
}: UnitTableHeaderProps) => {
  const [
    isSelectProductMaterialDropdownOpen,
    setIsSelectProductMaterialDropdownOpen,
  ] = useState(false);

  return (
    <div className="flex h-12 items-center px-3 w-full border-t border-b border-lg Me_Body-1 text-sv">
      <Checkbox
        isChecked={isAllSelected}
        onToggle={onToggleSelectAll || (() => {})}
      />
      <div
        className="h-full flex-[0.6] px-3 flex justify-between items-center cursor-pointer relative hover:bg-bg transition-colors duration-200"
        onClick={() => setIsSelectProductMaterialDropdownOpen(true)}
      >
        <p className="">{selectedCategory}</p>
        <CaretDown size={16} weight="fill" className="text-sv" />

        {isSelectProductMaterialDropdownOpen && (
          <div className="absolute top-full left-0 right-0 z-10 mt-2">
            <SelectProductMaterialDropdown
              onClose={() => setIsSelectProductMaterialDropdownOpen(false)}
              onSelect={(category) => {
                onCategoryChange?.(category);
                setIsSelectProductMaterialDropdownOpen(false);
              }}
              width="w-full"
            />
          </div>
        )}
      </div>
      <p className="flex-1 px-3">이름</p>
      <p className="flex-1 px-3">기준 단위</p>
      <p className="flex-1 px-3">변환 단위</p>
      <p className="flex-1 px-3">변환식</p>
      <p className="flex-[0.7] px-3">액션</p>
    </div>
  );
};
