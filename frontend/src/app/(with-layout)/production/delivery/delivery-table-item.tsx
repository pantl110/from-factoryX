const DeliveryTableItem = () => {
  return (
    <div className="flex items-center h-14 Me_Body-1 rounded border-b border-[#eeeeee]">
      <div className="flex items-center py-3 px-2">
        <input type="checkbox" className="w-4 h-4 border-sv" />
      </div>
      <p className="flex-1 py-1 px-3 text-dg">PRD-00123</p>
      <p className="flex-[2] py-1 px-3 text-dg">플라스틱 컵</p>
      <p className="flex-1 py-1 px-3 text-dg">90x120mm</p>
      <p className="w-[80px] py-1 px-3 text-dg">EA</p>
      <p className="flex-1 py-1 px-3 text-dg">2,000</p>
      <p className="w-[100px] py-1 px-3 text-dg">500</p>
      <p className="flex-1 py-1 px-3 text-dg">1,000,000</p>
      <p className="flex-1 py-1 px-3 text-dg">2025-05-06</p>
      <p className="w-[130px] py-1 px-3 text-dg">확인하기</p>
    </div>
  );
};

export default DeliveryTableItem;
