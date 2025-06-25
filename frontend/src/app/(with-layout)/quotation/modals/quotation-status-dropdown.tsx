import Chip from "@/ui/chip";
import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";

interface QuotationStatusDropdownProps {
  onClose: () => void;
}

const QuotationStatusDropdown = ({ onClose }: QuotationStatusDropdownProps) => {
  return (
    <Dropdown width="w-full" onClose={onClose}>
      <DropdownItem
        onClick={(e) => {
          e?.stopPropagation();
          onClose();
        }}
      >
        <Chip text="견적 협의" bgColor="bg-yellow-8" textColor="text-yellow" />
      </DropdownItem>
      <DropdownItem
        onClick={(e) => {
          e?.stopPropagation();
          onClose();
        }}
      >
        <Chip text="중단" bgColor="bg-red-8" textColor="text-red" />
      </DropdownItem>
    </Dropdown>
  );
};

export default QuotationStatusDropdown;
