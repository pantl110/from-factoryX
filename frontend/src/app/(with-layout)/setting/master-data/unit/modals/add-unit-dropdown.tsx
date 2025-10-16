import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';

interface AddUnitDropdownProps {
  onClose: () => void;
  onSelect: (type: 'material' | 'product') => void;
}

const AddUnitDropdown = ({ onClose, onSelect }: AddUnitDropdownProps) => {
  return (
    <Dropdown onClose={onClose} width="w-[220px]">
      <DropdownItem text="자재" onClick={() => onSelect('material')} />
      <DropdownItem text="제품" onClick={() => onSelect('product')} />
    </Dropdown>
  );
};

export default AddUnitDropdown;
