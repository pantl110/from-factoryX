const QuotationTableHeader = () => {
  return (
    <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1 text-sv">
      <p className="flex-1 py-1 px-3">제품명</p>
      <p className="flex-1 py-1 px-3">제품코드</p>
      <p className="flex-1 py-1 px-3">규격</p>
      <p className="w-[80px] py-1 px-3">단위</p>
      <p className="flex-1 py-1 px-3">제작 수량</p>
      <p className="w-[100px] py-1 px-3">단가</p>
      <p className="flex-1 py-1 px-3">금액</p>
    </div>
  );
};

export default QuotationTableHeader;
