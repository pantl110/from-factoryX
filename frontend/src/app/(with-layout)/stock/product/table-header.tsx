import Checkbox from '@/ui/checkbox';

interface TableHeaderProps {
  isAllChecked: boolean;
  onToggleAll: () => void;
}

const TableHeader = ({ isAllChecked, onToggleAll }: TableHeaderProps) => {
  return (
    <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1">
      <Checkbox isChecked={isAllChecked} onToggle={onToggleAll || (() => {})} />
      <p className="flex-1 px-3 text-sv">품목명</p>
      <p className="flex-1 px-3 text-sv">품목 코드</p>
      <p className="flex-1 px-3 text-sv">규격</p>
      <p className="w-[80px] px-3 text-sv">단위</p>
      <p className="flex-1 px-3 text-sv">현재 재고</p>
    </div>
  );
};

export default TableHeader;
