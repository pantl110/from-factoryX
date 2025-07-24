import { ClientResponseModel } from '@/types/data-model';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';

export const ClientNameDropdown = ({
  items,
  onSelect,
  width,
  style,
}: {
  items: ClientResponseModel[];
  onSelect: (item: ClientResponseModel) => void;
  width?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <Dropdown onClose={() => {}} width={width} style={style}>
      {items.slice(0, 6).map((item) => (
        <DropdownItem
          key={item.id}
          text={item.name}
          onClick={() => onSelect(item)}
          search={true}
        />
      ))}
    </Dropdown>
  );
};
