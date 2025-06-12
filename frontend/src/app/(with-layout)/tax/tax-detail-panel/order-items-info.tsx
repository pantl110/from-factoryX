const OrderItemsInfo = () => {
  return (
    <div>
      <h3 className="Heading-3 text-dg mb-3">주문 품목 정보</h3>
      <div className="flex flex-col gap-4 bg-lg-table px-4 py-4 rounded-lg">
        <div className="flex w-full justify-between items-center">
          <span className="w-[150px] Me_Body-1 text-sv">공급가액</span>
          <span className="text-primary Me_Body-3">
            600,000,000<span className="text-sv Me_Body-2">원</span>
          </span>
        </div>
        <div className="flex w-full justify-between items-center">
          <span className="w-[150px] Me_Body-1 text-sv">세액(VAT 10%)</span>
          <span className="text-primary Me_Body-3">
            600,000<span className="text-sv Me_Body-2">원</span>
          </span>
        </div>
        <div className="flex w-full justify-between items-center">
          <span className="w-[150px] Me_Body-1 text-sv">총액</span>
          <span className="text-primary Me_Body-3">
            6,600,000<span className="text-sv Me_Body-2">원</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsInfo;
