import StockInfoItem from './stock-info-item';

const StockInfo = () => {
  return (
    <div className="py-8 flex flex-col">
      <h3 className="px-7 m-Heading-3-semibold pb-8">재고 정보</h3>

      <StockInfoItem />
      <StockInfoItem />
      <StockInfoItem />
    </div>
  );
};

export default StockInfo;
