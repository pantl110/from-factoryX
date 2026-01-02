import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { useTranslations } from 'next-intl';

interface AddUnitDropdownProps {
  onClose: () => void;
  onSelect: (type: 'material' | 'product') => void;
}

const AddUnitDropdown = ({ onClose, onSelect }: AddUnitDropdownProps) => {
  const tCommon = useTranslations('common');

  return (
    <Dropdown onClose={onClose} width="w-[220px]">
      <DropdownItem
        text={tCommon('product')}
        onClick={() => onSelect('product')}
      />
      <DropdownItem
        text={tCommon('material')}
        onClick={() => onSelect('material')}
      />
    </Dropdown>
  );
};

export default AddUnitDropdown;
