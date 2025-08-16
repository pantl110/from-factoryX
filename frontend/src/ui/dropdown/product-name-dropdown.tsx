import { ProductResponseModel } from '@/types/data-model';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';

interface ProductNameDropdownProps {
  items: ProductResponseModel[];
  onSelect: (item: ProductResponseModel) => void;
  onClose: () => void;
  width?: string;
}

export const ProductNameDropdown = ({
  items,
  onSelect,
  onClose,
  width,
}: ProductNameDropdownProps) => {
  return (
    <Dropdown onClose={onClose} width={width} maxHeight={true}>
      {items.map((item, index) => (
        <DropdownItem
          key={item.id + index}
          text={item.name}
          onClick={() => onSelect(item)}
          search={true}
        />
      ))}
    </Dropdown>
  );
};
