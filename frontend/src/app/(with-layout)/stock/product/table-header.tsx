const TableHeader = () => {
  return (
    <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
      <p className="flex-1 py-1 px-3 text-sv">품목명</p>
      <p className="flex-1 py-1 px-3 text-sv">품목 코드</p>
      <p className="flex-1 py-1 px-3 text-sv">규격</p>
      <p className="w-[80px] py-1 px-3 text-sv">단위</p>
      <p className="flex-1 py-1 px-3 text-sv">현재 재고</p>
    </div>
  );
};

export default TableHeader;
