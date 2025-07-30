import Checkbox from '@/ui/checkbox';
import { CaretUpDown } from '@phosphor-icons/react/dist/ssr';

interface TableHeaderProps {
  isAllChecked: boolean;
  onToggleAll: () => void;
  currentOrder?: 'asc' | 'desc';
  onSortChange?: (order: 'asc' | 'desc') => void;
}

const TableHeader = ({
  isAllChecked,
  onToggleAll,
  currentOrder,
  onSortChange,
}: TableHeaderProps) => {
  const handleSortClick = () => {
    if (onSortChange) {
      const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      onSortChange(newOrder);
    }
  };

  return (
    <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1">
      <Checkbox isChecked={isAllChecked} onToggle={onToggleAll || (() => {})} />
      <p className="flex-1 px-3 text-sv">자재명</p>
      <p className="flex-1 px-3 text-sv">자재 코드</p>
      <p className="flex-1 px-3 text-sv">규격</p>
      <p className="flex-[0.5] px-3 text-sv">단위</p>
      <div
        className="px-3 flex-1 h-full flex items-center gap-1 cursor-pointer hover:bg-bg"
        onClick={handleSortClick}
      >
        <p className="text-sv">현재 재고</p>
        <CaretUpDown size={21} className="text-sv" />
      </div>
      <p className="w-[150px] text-sv px-3">자재 상태</p>
    </div>
  );
};

export default TableHeader;
