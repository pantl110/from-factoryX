import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";
import {
  TransactionStatusColorMap,
  TransactionStatusType,
} from "@/types/status-type";

const transactionStates: TransactionStatusType[] = ["미작성", "작성 완료"];

interface TransactionStateDropdownProps {
  onClose?: () => void;
}

const TransactionStateDropdown = ({
  onClose,
}: TransactionStateDropdownProps) => {
  return (
    <Dropdown onClose={onClose || (() => {})}>
      {transactionStates.map((state) => (
        <DropdownItem
          key={state}
          text={state}
          textColor={TransactionStatusColorMap[state]}
          onClick={onClose}
        />
      ))}
    </Dropdown>
  );
};

export default TransactionStateDropdown;
