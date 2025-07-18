import { MaterialDataModel } from '@/types/data-model';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';

interface MaterialNameDropdownProps {
  items: MaterialDataModel[];
  onSelect: (item: MaterialDataModel) => void;
  width?: string;
}

export const MaterialNameDropdown = ({
  items,
  onSelect,
  width,
}: MaterialNameDropdownProps) => {
  return (
    <Dropdown onClose={() => {}} width={width}>
      <div className="flex flex-col">
        {items.map((item) => (
          <DropdownItem
            key={item.id}
            text={item.materialName}
            onClick={() => onSelect(item)}
            search={true}
          />
        ))}
      </div>
    </Dropdown>
  );
};
