import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';

interface FacilityDropdownProps {
  onClose: () => void;
  style?: React.CSSProperties;
}

const FacilityDropdown = ({ onClose, style }: FacilityDropdownProps) => {
  return (
    <div style={style}>
      <Dropdown onClose={onClose} width="w-[153px]">
        <DropdownItem text="1호기" onClick={onClose} />
        <DropdownItem text="2호기" onClick={onClose} />
      </Dropdown>
    </div>
  );
};

export default FacilityDropdown;
