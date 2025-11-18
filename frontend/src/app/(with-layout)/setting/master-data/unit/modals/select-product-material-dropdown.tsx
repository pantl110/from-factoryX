import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';

interface SelectProductMaterialDropdownProps {
  onClose: () => void;
  onSelect: (category: string) => void;
}

const SelectProductMaterialDropdown = ({
  onClose,
  onSelect,
}: SelectProductMaterialDropdownProps) => {
  const categories = ['전체', '제품', '자재'];

  return (
    <Dropdown onClose={onClose} width="w-[120px]">
      {categories.map((category) => (
        <DropdownItem
          key={category}
          text={category}
          onClick={() => onSelect(category)}
        />
      ))}
    </Dropdown>
  );
};

export default SelectProductMaterialDropdown;
