import { Dropdown, DropdownItem } from '@/ui';
import type { TermType } from './types';
import { useTranslations } from 'next-intl';

interface TermDropdownProps {
  onClose: () => void;
  onSelect: (type: TermType) => void;
}

const TermDropdown = ({ onClose, onSelect }: TermDropdownProps) => {
  const t = useTranslations('tax.list.info.terms');

  return (
    <Dropdown onClose={onClose} width="w-[323px]">
      <DropdownItem
        text={t('invoice30')}
        onClick={() => onSelect('INVOICE_30')}
      />
      <DropdownItem
        text={t('invoiceEomNext')}
        onClick={() => onSelect('INVOICE_EOM_NEXT')}
      />
      <DropdownItem text={t('custom')} onClick={() => onSelect('CUSTOM')} />
    </Dropdown>
  );
};

export default TermDropdown;
