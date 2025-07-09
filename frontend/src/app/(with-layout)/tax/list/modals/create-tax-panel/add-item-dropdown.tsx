import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";

interface AddItemDropdownProps {
  onClose: () => void;
  onSelect: () => void;
}

const AddItemDropdown = ({ onClose, onSelect }: AddItemDropdownProps) => {
  return (
    <Dropdown onClose={onClose} width="w-[180px]">
      <DropdownItem text="기존 품목 추가" onClick={onSelect} />
      <DropdownItem text="새로운 품목 추가" onClick={onSelect} />
    </Dropdown>
  );
};

export default AddItemDropdown;
