import { MaterialItemModel } from '@/types/data-model';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';

interface MaterialNameDropdownProps {
  items: MaterialItemModel[];
  onSelect: (item: MaterialItemModel) => void;
  width?: string;
}

export const MaterialNameDropdown = ({
  items,
  onSelect,
  width,
}: MaterialNameDropdownProps) => {
  return (
    <Dropdown onClose={() => {}} width={width} maxHeight={true}>
      <div className="flex flex-col">
        {items.map((item) => (
          <DropdownItem
            key={item.code}
            text={item.name}
            onClick={() => onSelect(item)}
            search={true}
          />
        ))}
      </div>
    </Dropdown>
  );
};
