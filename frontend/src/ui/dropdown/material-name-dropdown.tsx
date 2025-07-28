import { MaterialResponseModel } from '@/types/data-model';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';

interface MaterialNameDropdownProps {
  items: MaterialResponseModel[];
  onSelect: (item: MaterialResponseModel) => void;
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
            key={item.id}
            text={item.name}
            onClick={() => onSelect(item)}
            search={true}
          />
        ))}
      </div>
    </Dropdown>
  );
};
