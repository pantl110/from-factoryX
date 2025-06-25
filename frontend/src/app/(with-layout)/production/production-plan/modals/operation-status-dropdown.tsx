import Chip from "@/ui/chip";
import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";
import { OperationStatusColorMap } from "@/types/status-type";

interface OperationStatusDropdownProps {
  onClose: () => void;
  style?: React.CSSProperties;
}

const OperationStatusDropdown = ({
  onClose,
  style,
}: OperationStatusDropdownProps) => {
  const color = OperationStatusColorMap;

  return (
    <Dropdown onClose={onClose} width="w-[120px]" style={style}>
      <DropdownItem onClick={onClose}>
        <Chip
          text="가동 대기"
          bgColor={color["가동 대기"].bgColor}
          textColor={color["가동 대기"].textColor}
        />
      </DropdownItem>
      <DropdownItem onClick={onClose}>
        <Chip
          text="가동 중"
          bgColor={color["가동 중"].bgColor}
          textColor={color["가동 중"].textColor}
        />
      </DropdownItem>
      <DropdownItem onClick={onClose}>
        <Chip
          text="가동 완료"
          bgColor={color["가동 완료"].bgColor}
          textColor={color["가동 완료"].textColor}
        />
      </DropdownItem>
      <DropdownItem onClick={onClose}>
        <Chip
          text="가동 중지"
          bgColor={color["가동 중지"].bgColor}
          textColor={color["가동 중지"].textColor}
        />
      </DropdownItem>
    </Dropdown>
  );
};

export default OperationStatusDropdown;
