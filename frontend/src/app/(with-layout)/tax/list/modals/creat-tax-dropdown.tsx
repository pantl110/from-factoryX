import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";

interface CreatTaxDropdownProps {
  onClose: () => void;
}

const CreatTaxDropdown = ({ onClose }: CreatTaxDropdownProps) => {
  return (
    <Dropdown onClose={onClose}>
      <DropdownItem text="품목 기준으로 발행" />
      <DropdownItem text="합계금액 기준으로 발행" />
    </Dropdown>
  );
};

export default CreatTaxDropdown;
