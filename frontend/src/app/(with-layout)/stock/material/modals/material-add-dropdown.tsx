import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";
import { Upload, Plus } from "@phosphor-icons/react/dist/ssr";

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
  return (
    <Dropdown onClose={onClose}>
      <DropdownItem
        text="엑셀로 한 번에 등록"
        icon={<Upload />}
        onClick={onOpenExcelModal}
      />
      <DropdownItem
        text="개별 자재 추가"
        icon={<Plus />}
        onClick={onOpenClientInfoModal}
      />
    </Dropdown>
  );
};

export default MaterialAddDropdown;
