import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";
import { Upload, Plus } from "@phosphor-icons/react/dist/ssr";

interface ProductAddDropdownProps {
  onClose: () => void;
}

const ProductAddDropdown = ({ onClose }: ProductAddDropdownProps) => {
  return (
    <Dropdown onClose={onClose}>
      <DropdownItem text="엑셀로 한 번에 등록" icon={<Upload />} />
      <DropdownItem text="직접 하나씩 추가" icon={<Plus />} />
    </Dropdown>
  );
};

export default ProductAddDropdown;
