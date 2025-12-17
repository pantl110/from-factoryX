import { Dropdown, DropdownItem } from '@/ui';
import { TermType } from './types';

interface TermDropdownProps {
  onClose: () => void;
  onSelect: (type: TermType) => void;
}

const TermDropdown = ({ onClose, onSelect }: TermDropdownProps) => {
  return (
    <Dropdown onClose={onClose} width="w-[323px]">
      <DropdownItem
        text="세금계산서 발행 후 30일 이내 입금"
        onClick={() => onSelect('INVOICE_30')}
      />
      <DropdownItem
        text="세금계산서 발행 익월 말일 입금"
        onClick={() => onSelect('INVOICE_EOM_NEXT')}
      />
      <DropdownItem
        text="당월 말일 마감, 익월 25일 지급"
        onClick={() => onSelect('MONTH_END_25_NEXT')}
      />
      <DropdownItem
        text="검수 완료 후 30일 이내 입금"
        onClick={() => onSelect('INSPECTION_30')}
      />
      <DropdownItem text="직접 입력" onClick={() => onSelect('CUSTOM')} />
    </Dropdown>
  );
};

export default TermDropdown;
