const DetailSalesHeader = () => {
  return (
    <div className="flex items-center w-full border-t border-b border-[#eeeeee] text-sv Me_Body-1 h-12">
      <p className="flex-[2]">품목명</p>
      <p className="flex-[2]">규격</p>
      <p className="flex-1">수량</p>
      <p className="w-[80px]">단위</p>
      <p className="flex-1">단가</p>
      <p className="flex-1">공급가액</p>
      <p className="flex-1">세액</p>
    </div>
  );
};

export default DetailSalesHeader;
