import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";
import { TaxStatusColorMap, TaxStatusType } from "@/types/status-type";

const taxStates: TaxStatusType[] = ["미발행", "발행 중", "발행 완료"];

const TaxStateDropdown = () => {
  return (
    <Dropdown onClose={() => {}}>
      {taxStates.map((state) => (
        <DropdownItem
          key={state}
          text={state}
          textColor={TaxStatusColorMap[state]}
        />
      ))}
    </Dropdown>
  );
};

export default TaxStateDropdown;
