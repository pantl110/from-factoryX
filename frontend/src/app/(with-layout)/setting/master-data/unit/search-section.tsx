import MiniBtn from '@/ui/mini-btn';
import SearchInput from '@/ui/search-input';
import { CaretDown } from '@phosphor-icons/react';
import { useState } from 'react';
import SelectProductMaterialDropdown from './modals/select-product-material-dropdown';

interface SearchSectionProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
}

const SearchSection = ({ value, onChange, onEnter }: SearchSectionProps) => {
  const [
    isSelectProductMaterialDropdownOpen,
    setIsSelectProductMaterialDropdownOpen,
  ] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('전체');

  return (
    <div className="flex items-center justify-between pb-4">
      <div className="relative">
        <MiniBtn
          text={selectedCategory}
          width="w-[120px]"
          icon={CaretDown}
          iconColor="text-dg"
          iconWeight="fill"
          iconPosition="right"
          justifyBetween={true}
          variant="whiteOutline"
          onClick={() => setIsSelectProductMaterialDropdownOpen(true)}
        />

        {isSelectProductMaterialDropdownOpen && (
          <div className="absolute top-full left-0 z-10 mt-2">
            <SelectProductMaterialDropdown
              onClose={() => setIsSelectProductMaterialDropdownOpen(false)}
              onSelect={(category) => {
                setSelectedCategory(category);
                setIsSelectProductMaterialDropdownOpen(false);
              }}
            />
          </div>
        )}
      </div>

      <SearchInput
        placeholder="자재명, 품목명을 입력해 검색하세요."
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onEnter?.();
          }
        }}
      />
    </div>
  );
};

export default SearchSection;
