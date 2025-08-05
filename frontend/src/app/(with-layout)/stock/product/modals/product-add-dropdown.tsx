import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';

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
  return (
    <Dropdown onClose={onClose}>
      <DropdownItem text="개별 품목 추가" onClick={onOpenCreatePanel} />
      <DropdownItem text="엑셀로 한 번에 등록" onClick={onOpenExcelModal} />
    </Dropdown>
  );
};

export default ProductAddDropdown;
