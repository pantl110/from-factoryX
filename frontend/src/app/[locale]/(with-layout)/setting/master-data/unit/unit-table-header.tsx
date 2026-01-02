import { CaretDown } from '@phosphor-icons/react';
import { useState } from 'react';
import SelectProductMaterialDropdown from './modals/select-product-material-dropdown';
import Checkbox from '@/ui/checkbox';
import { useTranslations } from 'next-intl';

interface UnitTableHeaderProps {
  onCategoryChange?: (category: string) => void;
  selectedCategory: string;
  isAllSelected?: boolean;
  onToggleSelectAll?: () => void;
  hasItems?: boolean;
}

export const UnitTableHeader = ({
  onCategoryChange,
  selectedCategory,
  isAllSelected = false,
  onToggleSelectAll,
  hasItems = true,
}: UnitTableHeaderProps) => {
  const tCommon = useTranslations('common');
  const tTableHeader = useTranslations('setting.masterData.unit.tableHeader');
  const [
    isSelectProductMaterialDropdownOpen,
    setIsSelectProductMaterialDropdownOpen,
  ] = useState(false);

  // selectedCategory를 번역된 텍스트로 변환
  const getCategoryLabel = (category: string) => {
    if (category === 'all') return tCommon('all');
    if (category === 'product') return tCommon('product');
    if (category === 'material') return tCommon('material');
    return category; // fallback
  };

  return (
    <div className="flex h-12 items-center px-3 w-full border-t border-b border-lg Me_Body-1 text-sv">
      {hasItems && (
        <Checkbox
          isChecked={isAllSelected}
          onToggle={onToggleSelectAll || (() => {})}
        />
      )}
      <div
        className="h-full flex-[0.6] px-3 flex justify-between items-center cursor-pointer relative hover:bg-bg transition-colors duration-200"
        onClick={() => setIsSelectProductMaterialDropdownOpen(true)}
      >
        <p className="">{getCategoryLabel(selectedCategory || 'all')}</p>
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
      <p className="flex-[1.2] px-3">{tTableHeader('name')}</p>
      <p className="flex-1 px-3">{tTableHeader('standardUnit')}</p>
      <p className="flex-1 px-3">{tTableHeader('conversionUnit')}</p>
      <p className="flex-[1.4] px-3">{tTableHeader('conversionFormula')}</p>
      {/* <p className="flex-[0.7] px-3">액션</p> */}
    </div>
  );
};
