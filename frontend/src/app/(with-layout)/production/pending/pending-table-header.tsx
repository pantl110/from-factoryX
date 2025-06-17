const PendingTableHeader = () => {
  return (
    <div className="flex items-center w-full h-12 border-t border-b border-[#eeeeee] Me_Body-1 bg-bg rounded text-sv">
      <p className="w-[100px] py-1 px-3">가동상태</p>
      <p className="flex-[2] py-1 px-3">품목명</p>
      <p className="flex-1 py-1 px-3">품목코드</p>
      <p className="flex-1 py-1 px-3">규격</p>
      <p className="w-[80px] py-1 px-3">단위</p>
      <p className="flex-1 py-1 px-3">목표수량</p>
      <p className="flex-1 py-1 px-3">지시수량</p>
      <p className="flex-1 py-1 px-3">사용설비</p>
      <p className="flex-1 py-1 px-3">자재상태</p>
      <p className="flex-[1.1] py-1 px-3">생산일자</p>
      <p className="flex-1 py-1 px-3">생산시간</p>
      <p className="flex-1 py-1 px-3">생산 담당자</p>
      <p className="flex-3 py-1 px-3">특이사항</p>
    </div>
  );
};

export default PendingTableHeader;
