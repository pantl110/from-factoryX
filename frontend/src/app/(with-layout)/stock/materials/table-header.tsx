import { CaretUpDown } from "@phosphor-icons/react/dist/ssr";

const TableHeader = () => {
  return (
    <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
      <p className="flex-1 py-1 px-3 text-sv">품목명</p>
      <p className="flex-1 py-1 px-3 text-sv">품목 코드</p>
      <p className="flex-1 py-1 px-3 text-sv">창고 위치</p>
      <div className="py-1 px-3 flex-1 flex items-center gap-1">
        <p className="text-sv">최근 생산일자</p>
        <CaretUpDown size={11} className="text-sv" />
      </div>
    </div>
  );
};

export default TableHeader;
