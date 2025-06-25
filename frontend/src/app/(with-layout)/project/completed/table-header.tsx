import { CaretUpDown } from "@phosphor-icons/react/dist/ssr";

interface TableHeaderProps {
  isDeleteMode: boolean;
}

const TableHeader = ({ isDeleteMode }: TableHeaderProps) => {
  return (
    <div className="flex items-center h-12 w-full min-w-[1146px] border-t border-b border-[#eeeeee] Me_Body-1">
      <div className="flex items-center py-3 px-2">
        {isDeleteMode && (
          <input type="checkbox" className="w-4 h-4 border-sv" />
        )}
      </div>

      <p className="w-[150px] py-1 px-3 text-sv">진행상태</p>
      <p className="flex-1 py-1 px-3 text-sv">업체명</p>
      <p className="flex-1 py-1 px-3 text-sv">품목명</p>
      <div className="w-[200px] px-3 flex gap-1 items-center">
        <p className=" text-sv">완료일자</p>
        <CaretUpDown size={16} className="text-sv" />
      </div>
    </div>
  );
};

export default TableHeader;
