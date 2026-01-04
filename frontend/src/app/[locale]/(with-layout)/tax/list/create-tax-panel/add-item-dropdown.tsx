import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { useTranslations } from 'next-intl';

interface AddItemDropdownProps {
  onClose: () => void;
  onSelect: (action: 'existing' | 'new') => void;
}

const AddItemDropdown = ({ onClose, onSelect }: AddItemDropdownProps) => {
  const t = useTranslations('tax.createTaxPanel.addItemDropdown');

  return (
    <Dropdown onClose={onClose} width="w-fit min-w-[180px] mr-0.5">
      <DropdownItem text={t('existing')} onClick={() => onSelect('existing')} />
      <DropdownItem text={t('new')} onClick={() => onSelect('new')} />
    </Dropdown>
  );
};

export default AddItemDropdown;
