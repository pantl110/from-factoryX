const ProductionLogTableHeader = () => {
  return (
    <div className="flex items-center h-12 Me_Body-1 text-sv rounded bg-lg-table">
      <p className="flex-1 py-1 px-3">품목코드</p>
      <p className="flex-[2] py-1 px-3">품목명</p>
      <p className="flex-1 py-1 px-3">규격</p>
      <p className="w-[80px] py-1 px-3">단위</p>
      <p className="flex-1 py-1 px-3">목표수량</p>
      <p className="flex-1 py-1 px-3">생산수량</p>
      <p className="flex-1 py-1 px-3">생산설비</p>
      <p className="flex-1 py-1 px-3">단위당 시간</p>
      <p className="flex-1 py-1 px-3">자재상태</p>
      <p className="flex-1 py-1 px-3">생산 담당자</p>
    </div>
  );
};

export default ProductionLogTableHeader;
