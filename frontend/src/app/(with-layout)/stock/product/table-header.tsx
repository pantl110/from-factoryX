interface TableHeaderProps {
  isDeleteMode: boolean;
}

const TableHeader = ({ isDeleteMode }: TableHeaderProps) => {
  return (
    <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
      {isDeleteMode && (
        <div
          className="flex items-center px-3"
          onClick={(e) => e.stopPropagation()}
        >
          <input type="checkbox" className="w-4 h-4 border-sv" />
        </div>
      )}
      <p className="flex-1 px-3 text-sv">품목명</p>
      <p className="flex-1 px-3 text-sv">품목 코드</p>
      <p className="flex-1 px-3 text-sv">규격</p>
      <p className="w-[80px] px-3 text-sv">단위</p>
      <p className="flex-1 px-3 text-sv">현재 재고</p>
    </div>
  );
};

export default TableHeader;
