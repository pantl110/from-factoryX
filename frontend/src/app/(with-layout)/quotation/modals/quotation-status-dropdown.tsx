import Chip from "@/ui/chip";
import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";

interface QuotationStatusDropdownProps {
  onClose: () => void;
}

const QuotationStatusDropdown = ({ onClose }: QuotationStatusDropdownProps) => {
  return (
    <Dropdown
      width="w-full"
      onClose={onClose}
      padding="p-4"
      className="gap-2.5"
    >
      <DropdownItem
        onClick={(e) => {
          e?.stopPropagation();
          onClose();
        }}
        noHover={true}
        chip={true}
      >
        <Chip
          text="견적 협의"
          bgColor="bg-yellow-8"
          textColor="text-yellow"
          hover="hover:bg-yellow-hover"
          onClick={onClose}
        />
      </DropdownItem>
      <DropdownItem
        onClick={(e) => {
          e?.stopPropagation();
          onClose();
        }}
        noHover={true}
        chip={true}
      >
        <Chip
          text="중단"
          bgColor="bg-red-8"
          textColor="text-red"
          hover="hover:bg-red-hover"
          onClick={onClose}
        />
      </DropdownItem>
    </Dropdown>
  );
};

export default QuotationStatusDropdown;
