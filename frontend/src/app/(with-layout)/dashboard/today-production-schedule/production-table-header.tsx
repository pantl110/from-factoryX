const ProductionTableHeader = () => {
  return (
    <div className="flex min-w-[1421px] h-12 items-center Me_Body-1 text-sv border-t border-b border-[#eeeeee]">
      <div className="py-1 px-3 flex-2">
        <p>업체명</p>
      </div>
      <div className="py-1 px-3 flex-2">
        <p>품목명</p>
      </div>
      <div className="py-1 px-3 flex-[1.5]">
        <p>품목코드</p>
      </div>
      <div className="py-1 px-3 flex-1">
        <p>규격</p>
      </div>
      <div className="py-1 px-3 w-[80px]">
        <p>단위</p>
      </div>
      <div className="py-1 px-3 flex-1">
        <p>생산 수량</p>
      </div>
      <div className="py-1 px-3 flex-[1.5]">
        <p>생산 설비</p>
      </div>
      <div className="py-1 px-3 flex-2">
        <p>생산시간</p>
      </div>
    </div>
  );
};

export default ProductionTableHeader;
