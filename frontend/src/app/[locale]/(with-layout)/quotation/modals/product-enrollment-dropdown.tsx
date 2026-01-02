import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { useTranslations } from 'next-intl';

interface ProductEnrollmentDropdownProps {
  onClose: () => void;
  onAddOldProductClick: () => void;
  onAddNewProductClick: () => void;
}

const ProductEnrollmentDropdown = ({
  onClose,
  onAddOldProductClick,
  onAddNewProductClick,
}: ProductEnrollmentDropdownProps) => {
  const t = useTranslations('quotation.productEnrollment');

  return (
    <Dropdown onClose={onClose} width="w-fit">
      <DropdownItem
        text={t('addExistingProduct')}
        onClick={onAddOldProductClick}
      />
      <DropdownItem text={t('addNewProduct')} onClick={onAddNewProductClick} />
    </Dropdown>
  );
};

export default ProductEnrollmentDropdown;
