import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';

interface AddItemDropdownProps {
  onClose: () => void;
  onSelect: (action: 'existing' | 'new') => void;
}

const AddItemDropdown = ({ onClose, onSelect }: AddItemDropdownProps) => {
  return (
    <Dropdown onClose={onClose} width="w-[180px]">
      <DropdownItem
        text="기존 제품 추가"
        onClick={() => onSelect('existing')}
      />
      <DropdownItem text="새로운 제품 추가" onClick={() => onSelect('new')} />
    </Dropdown>
  );
};

export default AddItemDropdown;
