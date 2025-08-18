import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import React from 'react';

interface IssueTypeDropdownProps {
  onClose: () => void;
  onSelect: (issueType: '청구' | '영수') => void;
}

const IssueTypeDropdown = ({ onClose, onSelect }: IssueTypeDropdownProps) => {
  return (
    <div className="absolute z-50 top-12 right-0 w-full">
      <Dropdown onClose={onClose} width="w-full">
        <DropdownItem text="청구" onClick={() => onSelect('청구')} />
        <DropdownItem text="영수" onClick={() => onSelect('영수')} />
      </Dropdown>
    </div>
  );
};

export default IssueTypeDropdown;
