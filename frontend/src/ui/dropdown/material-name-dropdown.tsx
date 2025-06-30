import { MaterialDataModel } from "@/mocks/material-data";
import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";

export const MaterialNameDropdown = ({
  items,
  onSelect,
  width,
}: {
  items: MaterialDataModel[];
  onSelect: (item: MaterialDataModel) => void;
  width?: string;
}) => {
  return (
    <Dropdown onClose={() => {}} width={width}>
      {items.slice(0, 6).map((item) => (
        <DropdownItem
          key={item.id}
          text={item.materialName}
          onClick={() => onSelect(item)}
        />
      ))}
    </Dropdown>
  );
};
