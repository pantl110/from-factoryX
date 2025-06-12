interface TableHeaderProps {
  lastLabel: string;
}

const TableHeader = ({ lastLabel }: TableHeaderProps) => {
  return (
    <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
      <div className="flex items-center py-3 px-2">
        <input type="checkbox" className="w-4 h-4 border-sv" />
      </div>
      <p className="w-[150px] py-1 px-3 text-sv">진행상태</p>
      <p className="flex-1 py-1 px-3 text-sv">업체명</p>
      <p className="flex-1 py-1 px-3 text-sv">품목</p>
      <p className="w-[200px] py-1 px-3 text-sv">진행일자</p>
      <p className="w-[200px] py-1 px-3 text-sv">{lastLabel}</p>
    </div>
  );
};

export default TableHeader;
