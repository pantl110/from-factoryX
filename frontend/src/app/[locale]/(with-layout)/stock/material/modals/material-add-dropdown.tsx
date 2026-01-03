import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { useTranslations } from 'next-intl';

interface MaterialAddDropdownProps {
  onClose: () => void;
  onOpenExcelModal: () => void;
  onOpenClientInfoModal: () => void;
}

const MaterialAddDropdown = ({
  onClose,
  onOpenExcelModal,
  onOpenClientInfoModal,
}: MaterialAddDropdownProps) => {
  const t = useTranslations('stock.material.modals.materialAddDropdown');

  return (
    <Dropdown onClose={onClose}>
      <DropdownItem text={t('addIndividual')} onClick={onOpenClientInfoModal} />{' '}
      <DropdownItem text={t('addByExcel')} onClick={onOpenExcelModal} />
    </Dropdown>
  );
};

export default MaterialAddDropdown;
