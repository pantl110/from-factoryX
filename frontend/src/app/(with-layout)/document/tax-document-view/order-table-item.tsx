const OrderTableItem = () => {
  return (
    <div className="h-14 w-full flex items-center Me_Body-1 text-dg border-b border-[#eeeeee]">
      <p className="flex-2 px-3 truncate title={title}">플라스틱 컵</p>
      <p className="flex-2 px-3">90x120mm</p>
      <p className="flex-1 px-3">2,000</p>
      <p className="w-[80px] px-3">EA</p>
      <p className="flex-1 px-3">500</p>
      <p className="flex-1 px-3">1,000,000</p>
      <p className="flex-1 px-3">1,000,000</p>
    </div>
  );
};

export default OrderTableItem;
