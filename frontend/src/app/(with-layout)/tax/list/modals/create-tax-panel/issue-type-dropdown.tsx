import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import React from 'react';
import { createPortal } from 'react-dom';

interface IssueTypeDropdownProps {
  onClose: () => void;
  onSelect: (issueType: '청구' | '영수') => void;
  position?: { top: number; left: number };
}

const IssueTypeDropdown = ({
  onClose,
  onSelect,
  position,
}: IssueTypeDropdownProps) => {
  const dropdownContent = (
    <div
      className="fixed z-50"
      style={{
        top: (position?.top ?? 0) + 8,
        left: position?.left ?? 0,
      }}
    >
      <Dropdown onClose={onClose} width="w-[123px]">
        <DropdownItem text="청구" onClick={() => onSelect('청구')} />
        <DropdownItem text="영수" onClick={() => onSelect('영수')} />
      </Dropdown>
    </div>
  );

  return typeof window !== 'undefined'
    ? createPortal(dropdownContent, document.body)
    : null;
};

export default IssueTypeDropdown;
