import MaterialStockLogItem from './material-stock-log-item';

const MaterialStockLog = () => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
        <p className="flex-1 py-1 px-3 text-sv">처리일자</p>
        <p className="flex-1 py-1 px-3 text-sv">상태</p>
        <p className="flex-1 py-1 px-3 text-sv">수량</p>
        <p className="flex-1 py-1 px-3 text-sv">현재 재고</p>
        <p className="flex-1 py-1 px-3 text-sv">매입 세금계산서</p>
        <p className="flex-1 py-1 px-3 text-sv">현금 영수증</p>
      </div>
      <MaterialStockLogItem
        date="2025-06-13"
        status="출고"
        quantity={500}
        productName="플라스틱 컵"
        currentStock={3500}
      />
      <MaterialStockLogItem
        date="2025-06-5"
        status="입고"
        quantity={1000}
        productName="-"
        currentStock={3500}
      />
      <MaterialStockLogItem
        date="2025-06-13"
        status="출고"
        quantity={1250}
        productName="플라스틱 컵"
        currentStock={3500}
      />
    </div>
  );
};

export default MaterialStockLog;
