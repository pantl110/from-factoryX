import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { useTranslations } from 'next-intl';

interface ProductAddDropdownProps {
  onClose: () => void;
  onOpenExcelModal: () => void;
  onOpenCreatePanel: () => void;
}

const ProductAddDropdown = ({
  onClose,
  onOpenExcelModal,
  onOpenCreatePanel,
}: ProductAddDropdownProps) => {
  const t = useTranslations('stock.product.modals.productAddDropdown');

  return (
    <Dropdown onClose={onClose}>
      <DropdownItem text={t('addIndividual')} onClick={onOpenCreatePanel} />
      <DropdownItem text={t('addByExcel')} onClick={onOpenExcelModal} />
    </Dropdown>
  );
};

export default ProductAddDropdown;
