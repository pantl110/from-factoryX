import { CaretUpDown } from "@phosphor-icons/react/dist/ssr";

const TableHeader = () => {
  return (
    <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
      <p className="flex-1 py-1 px-3 text-sv">자제명</p>
      <p className="flex-1 py-1 px-3 text-sv">자재코드</p>
      <p className="w-[80px] py-1 px-3 text-sv">단위</p>
      <div className="py-1 px-3 flex-1 flex items-center gap-1">
        <p className="text-sv">현재 재고</p>
        <CaretUpDown size={11} className="text-sv" />
      </div>
      <p className="w-[100px] py-1 px-3 text-sv">상태</p>
      <p className="flex-1 py-1 px-3 text-sv">최소 재고</p>
      <p className="flex-1 py-1 px-3 text-sv">창고 위치</p>
      <div className="py-1 px-3 flex-1 flex items-center gap-1">
        <p className="text-sv">입고일자</p>
        <CaretUpDown size={11} className="text-sv" />
      </div>
    </div>
  );
};

export default TableHeader;
