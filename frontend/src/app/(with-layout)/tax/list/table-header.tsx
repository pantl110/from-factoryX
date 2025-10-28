import Checkbox from '@/ui/checkbox';

interface TableHeaderProps {
  checkedCount: number;
  onToggleAll: () => void;
  onSortClick: () => void;
  sortDirection: 'asc' | 'desc';
  isAllChecked: boolean;
}

const TableHeader = ({
  onToggleAll,
  // onSortClick,
  isAllChecked,
}: TableHeaderProps) => {
  return (
    <div className="text-sv flex items-center w-full min-w-[1192px] h-12 border-t border-b border-[#eeeeee] Me_Body-1">
      <Checkbox isChecked={isAllChecked} onToggle={onToggleAll} />
      <p className="flex-1 px-3">구분</p>
      <p className="flex-2 px-3">업체명</p>
      <p className="flex-2 px-3">제품명</p>
      <p className="flex-[1.5] px-3">공급가액</p>
      <p className="flex-[1.5] px-3">세액</p>
      <p className="flex-[1.5] px-3">합계금액</p>
    </div>
  );
};

export default TableHeader;
