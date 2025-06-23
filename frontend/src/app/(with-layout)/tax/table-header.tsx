const TableHeader = () => {
  return (
    <div className="flex items-center w-[1373px] h-12 border-t border-b border-[#eeeeee] Me_Body-1">
      <div className="flex items-center py-3 px-2">
        <input type="checkbox" className="w-4 h-4 border-sv" />
      </div>
      <p className="w-[150px] py-1 px-3 text-sv">진행상태</p>
      <p className="w-[200px] py-1 px-3 text-sv">거래일자</p>
      <p className="flex-1 py-1 px-3 text-sv">거래처</p>
      <p className="flex-1 py-1 px-3 text-sv">공급가액</p>
      <p className="flex-1 py-1 px-3 text-sv">세액</p>
      <p className="flex-1 py-1 px-3 text-sv">합계금액</p>
      <p className="w-[110px] py-1 px-3 text-sv">상태</p>
    </div>
  );
};

export default TableHeader;
