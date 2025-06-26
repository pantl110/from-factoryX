import { CaretUpDown } from "@phosphor-icons/react/dist/ssr";

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
      <p className="flex-1 px-3 text-sv">자재명</p>
      <p className="flex-1 px-3 text-sv">자재 코드</p>
      <p className="w-[80px] px-3 text-sv">단위</p>
      <div className="px-3 flex-1 flex items-center gap-1">
        <p className="text-sv">현재 재고</p>
        <CaretUpDown size={11} className="text-sv" />
      </div>
      <div className="px-3 w-[100px] flex items-center gap-1">
        <p className="text-sv">상태</p>
        {/* <CaretUpDown size={11} className="text-sv" /> */}
      </div>
      <div className="px-3 flex-1 flex items-center gap-1">
        <p className="text-sv">입고일자</p>
        <CaretUpDown size={11} className="text-sv" />
      </div>
    </div>
  );
};

export default TableHeader;
