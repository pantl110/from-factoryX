import { CaretUpDown } from '@phosphor-icons/react/dist/ssr';
import Checkbox from '@/ui/checkbox';

interface TableHeaderProps {
  isAllChecked?: boolean;
  onToggleAll?: () => void;
  onSort?: (key: 'startDate' | 'endDate') => void;
  isArchived?: boolean;
}

const TableHeader = ({
  isAllChecked = false,
  onToggleAll,
  onSort,
  isArchived = false,
}: TableHeaderProps) => {
  return (
    <div
      className={`flex items-center h-12 ${
        isArchived ? 'w-full' : 'min-w-[1448px]'
      } border-t border-b border-lg Me_Body-1`}
    >
      <Checkbox isChecked={isAllChecked} onToggle={onToggleAll || (() => {})} />
      <p className="w-[150px] px-3 text-sv">진행상태</p>
      <p className="flex-2 px-3 text-sv">업체명</p>
      <p className="flex-2 px-3 text-sv">품목명</p>
      {!isArchived && (
        <div
          className="w-[200px] px-3 h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
          onClick={() => onSort && onSort('startDate')}
        >
          <p className=" text-sv">생산일자</p>
          <CaretUpDown size={21} className="text-sv" />
        </div>
      )}
      <div
        className="w-[200px] px-3 h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
        onClick={() => onSort && onSort('endDate')}
      >
        <p className=" text-sv">{isArchived ? '완료일자' : '납기일자'}</p>
        <CaretUpDown size={21} className="text-sv" />
      </div>
      {!isArchived && <p className="w-[200px] px-3 text-sv">세금계산서</p>}
    </div>
  );
};

export default TableHeader;
