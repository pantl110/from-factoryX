import { CaretUpDownIcon } from "@phosphor-icons/react/dist/ssr";

const TableHeader = () => {
  return (
    <div className="text-sv flex items-center w-full min-w-[1018px] h-12 border-t border-b border-[#eeeeee] Me_Body-1">
      <div className="flex items-center py-3 px-2">
        <input type="checkbox" className="w-4 h-4 border-sv" />
      </div>

      <p className="w-[150px] py-1 px-3">진행상태</p>
      <div className="py-1 px-3 flex gap-1 w-[200px] items-center">
        <p>거래일자</p>
        <CaretUpDownIcon size={16} />
      </div>
      <p className="flex-1 py-1 px-3">거래처</p>
      <p className="flex-1 py-1 px-3">공급가액</p>
      <p className="flex-1 py-1 px-3">세액</p>
      <p className="flex-1 py-1 px-3">합계금액</p>
    </div>
  );
};

export default TableHeader;
