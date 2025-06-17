const CompletedTableHeader = () => {
  return (
    <div className="flex items-center w-full h-12 border-t border-b border-[#eeeeee] Me_Body-1 bg-bg rounded">
      <p className="flex-1 py-1 px-3 text-sv">품목코드</p>
      <p className="flex-[2] py-1 px-3 text-sv">품목명</p>
      <p className="flex-1 py-1 px-3 text-sv">규격</p>
      <p className="w-[80px] py-1 px-3 text-sv">단위</p>
      <p className="flex-1 py-1 px-3 text-sv">목표수량</p>
      <p className="flex-1 py-1 px-3 text-sv">생산수량</p>
      <p className="flex-1 py-1 px-3 text-sv">생산설비</p>
      <p className="flex-1 py-1 px-3 text-sv">단위당 시간</p>
      <p className="flex-1 py-1 px-3 text-sv">자재상태</p>
      <p className="flex-1 py-1 px-3 text-sv">생산 담당자</p>
    </div>
  );
};

export default CompletedTableHeader;
