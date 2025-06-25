import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";
import { TaxStatusColorMap, TaxStatusType } from "@/types/status-type";

const taxStates: TaxStatusType[] = ["미발행", "발행 중", "발행 완료"];

interface TaxStateDropdownProps {
  onClose: () => void;
}

const TaxStateDropdown = ({ onClose }: TaxStateDropdownProps) => {
  return (
    <Dropdown onClose={onClose}>
      {taxStates.map((state) => (
        <DropdownItem
          key={state}
          text={state}
          textColor={TaxStatusColorMap[state]}
          onClick={onClose}
        />
      ))}
    </Dropdown>
  );
};

export default TaxStateDropdown;
