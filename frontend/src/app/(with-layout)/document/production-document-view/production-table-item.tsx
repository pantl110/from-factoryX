const ProductionTableItem = () => {
  return (
    <div className="w-full h-14 flex items-center Me_Body-1 text-dg border-b border-[#eeeeee]">
      <p className="flex-1 px-3 truncate title={title}">A품목</p>
      <p className="flex-1 px-3">P-001</p>
      <p className="flex-1 px-3">500ml</p>
      <p className="w-[80px] px-3">EA</p>
      <p className="flex-1 px-3">5,000</p>
      <p className="w-[120px] px-3">프레스 A</p>
      <p className="w-[80px] px-3">김민수</p>
      <p className="flex-1 px-3">09:00 - 11:00</p>
    </div>
  );
};

export default ProductionTableItem;
