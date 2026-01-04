import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import React from 'react';
import { useTranslations } from 'next-intl';

interface IssueTypeDropdownProps {
  onClose: () => void;
  onSelect: (issueType: 'invoice' | 'receipt') => void;
}

const IssueTypeDropdown = ({ onClose, onSelect }: IssueTypeDropdownProps) => {
  const tTax = useTranslations('tax');

  return (
    <div className="absolute z-50 top-12 right-0 w-full">
      <Dropdown onClose={onClose} width="w-full">
        <DropdownItem
          text={tTax('request')}
          onClick={() => onSelect('invoice')}
        />
        <DropdownItem
          text={tTax('receipt')}
          onClick={() => onSelect('receipt')}
        />
      </Dropdown>
    </div>
  );
};

export default IssueTypeDropdown;
