import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { useTranslations } from 'next-intl';

interface SelectProductMaterialDropdownProps {
  onClose: () => void;
  onSelect: (category: string) => void;
  width: string;
}

const SelectProductMaterialDropdown = ({
  onClose,
  onSelect,
  width,
}: SelectProductMaterialDropdownProps) => {
  const tCommon = useTranslations('common');
  const categories = [
    { key: 'all', label: tCommon('all') },
    { key: 'product', label: tCommon('product') },
    { key: 'material', label: tCommon('material') },
  ];

  return (
    <Dropdown onClose={onClose} width={width}>
      {categories.map((category) => (
        <DropdownItem
          key={category.key}
          text={category.label}
          onClick={() => onSelect(category.key)}
        />
      ))}
    </Dropdown>
  );
};

export default SelectProductMaterialDropdown;
