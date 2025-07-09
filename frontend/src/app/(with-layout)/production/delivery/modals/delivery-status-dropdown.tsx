import Chip from "@/ui/chip";
import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";

interface DeliveryStatusDropdownProps {
  onClose: () => void;
}
const DeliveryStatusDropdown = ({ onClose }: DeliveryStatusDropdownProps) => {
  return (
    <Dropdown width="w-full" onClose={onClose}>
      <DropdownItem>
        <Chip
          text="예정"
          bgColor="bg-bg"
          textColor="text-bl"
          hover="hover:bg-lg"
        />
      </DropdownItem>
      <DropdownItem>
        <Chip
          text="완료"
          textColor="text-primary"
          bgColor="bg-primary-8"
          hover="hover:bg-primary-hover"
        />
      </DropdownItem>
    </Dropdown>
  );
};

export default DeliveryStatusDropdown;
