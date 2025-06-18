const ReturnTableHeader = () => {
  return (
    <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1 text-sv">
      <p className="flex-[2] py-1 px-3">품목명</p>
      <p className="flex-1 py-1 px-3">품목코드</p>
      <p className="flex-1 py-1 px-3">규격</p>
      <p className="w-[80px] py-1 px-3">단위</p>
      <p className="flex-1 py-1 px-3">생산수량</p>
      <p className="flex-1 py-1 px-3">반품수량</p>
      <p className="flex-1 py-1 px-3">환불액</p>
    </div>
  );
};

export default ReturnTableHeader;
