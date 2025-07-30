import Dropdown from './dropdown';
import DropdownItem from './dropdown-item';
import { Trash } from '@phosphor-icons/react';

interface DeleteDropdownProps {
  onClose: () => void;
}

const DeleteDropdown = ({ onClose }: DeleteDropdownProps) => {
  return (
    <Dropdown onClose={onClose}>
      <DropdownItem
        text="삭제하기"
        icon={<Trash size={24} className="text-red" />}
        onClick={onClose}
      />
    </Dropdown>
  );
};

export default DeleteDropdown;
