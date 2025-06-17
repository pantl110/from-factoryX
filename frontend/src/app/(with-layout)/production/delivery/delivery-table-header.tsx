const DeliveryTableHeader = () => {
  return (
    <div className="flex items-center w-full h-12 border-t border-b border-[#eeeeee] Me_Body-1 bg-bg rounded">
      <div className="flex items-center py-3 px-2">
        <input type="checkbox" className="w-4 h-4 border-sv" />
      </div>
      <p className="flex-1 py-1 px-3 text-sv">품목코드</p>
      <p className="flex-[2] py-1 px-3 text-sv">품목명</p>
      <p className="flex-1 py-1 px-3 text-sv">규격</p>
      <p className="w-[80px] py-1 px-3 text-sv">단위</p>
      <p className="flex-1 py-1 px-3 text-sv">납품수량</p>
      <p className="w-[100px] py-1 px-3 text-sv">단가</p>
      <p className="flex-1 py-1 px-3 text-sv">금액</p>
      <p className="flex-1 py-1 px-3 text-sv">납품일자</p>
      <p className="w-[130px] py-1 px-3 text-sv">납품표</p>
    </div>
  );
};

export default DeliveryTableHeader;
