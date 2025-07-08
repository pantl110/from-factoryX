import Checkbox from "@/ui/checkbox";
import { CaretUpDown } from "@phosphor-icons/react/dist/ssr";

interface TableHeaderProps {
  isAllChecked: boolean;
  onToggleAll: () => void;
}

const TableHeader = ({ isAllChecked, onToggleAll }: TableHeaderProps) => {
  return (
    <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
      <Checkbox isChecked={isAllChecked} onToggle={onToggleAll || (() => {})} />
      <p className="flex-1 px-3 text-sv">자재명</p>
      <p className="flex-1 px-3 text-sv">자재 코드</p>
      <p className="w-[80px] px-3 text-sv">단위</p>
      <div className="px-3 flex-1 flex items-center gap-1">
        <p className="text-sv">현재 재고</p>
        <CaretUpDown size={21} className="text-sv" />
      </div>
      <p className="w-[150px] text-sv px-3">자재 상태</p>
    </div>
  );
};

export default TableHeader;
