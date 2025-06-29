import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";
import { Factory } from "@phosphor-icons/react";

interface FacilityDropdownProps {
  onClose: () => void;
  style?: React.CSSProperties;
}

const FacilityDropdown = ({ onClose, style }: FacilityDropdownProps) => {
  return (
    <div style={style}>
      <Dropdown onClose={onClose} width="w-[153px]">
        <DropdownItem
          text="1호기"
          icon={<Factory size={24} />}
          onClick={onClose}
        />
        <DropdownItem
          text="2호기"
          icon={<Factory size={24} />}
          onClick={onClose}
        />
      </Dropdown>
    </div>
  );
};

export default FacilityDropdown;
