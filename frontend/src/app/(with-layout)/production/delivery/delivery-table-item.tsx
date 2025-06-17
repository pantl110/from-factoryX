const DeliveryTableItem = () => {
  return (
    <div className="flex items-center w-full Me_Body-1">
      <div className="flex items-center h-14 py-3 px-2">
        <input type="checkbox" className="w-4 h-4 border-sv" />
      </div>
      <div className="flex flex-1 items-center h-14 border-b border-[#eeeeee] px-3 py-1">
        <p className="text-dg">PRD-00123</p>
      </div>
      <div className="flex flex-[2] items-center h-14 border-b border-[#eeeeee] px-3 py-1">
        <p className=" text-dg">플라스틱 컵</p>
      </div>
      <div className="flex flex-1 items-center h-14 border-b border-[#eeeeee] px-3 py-1">
        <p className="text-dg">90x120mm</p>
      </div>
      <div className="flex w-[80px] items-center h-14 border-b border-[#eeeeee] px-3 py-1">
        <p className="text-dg">EA</p>
      </div>
      <div className="flex flex-1 items-center h-14 border-b border-[#eeeeee] px-3 py-1">
        <p className="text-dg">2,000</p>
      </div>
      <div className="flex w-[100px] items-center h-14 border-b border-[#eeeeee] px-3 py-1">
        <p className="text-dg">500</p>
      </div>
      <div className="flex flex-1 items-center h-14 border-b border-[#eeeeee] px-3 py-1">
        <p className="text-dg">1,000,000</p>
      </div>
      <div className="flex flex-1 items-center h-14 border-b border-[#eeeeee] px-3 py-1">
        <p className="text-dg">2025-05-06</p>
      </div>
      <div className="flex w-[130px] items-center h-14 border-b border-[#eeeeee] px-3 py-1">
        <p className="text-dg">확인하기</p>
      </div>
    </div>
  );
};

export default DeliveryTableItem;
