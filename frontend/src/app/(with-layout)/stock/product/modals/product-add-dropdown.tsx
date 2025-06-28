import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";
import { Upload, Plus } from "@phosphor-icons/react/dist/ssr";

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
      <DropdownItem
        text="개별 품목 추가"
        icon={<Plus />}
        onClick={onOpenCreatePanel}
      />
      <DropdownItem
        text="엑셀로 한 번에 등록"
        icon={<Upload />}
        onClick={onOpenExcelModal}
      />
    </Dropdown>
  );
};

export default ProductAddDropdown;
