import StockStatusItem from './stock-status-item';

interface StockStatusProps {
  setIsMaterialStockStatusModalOpen: (isOpen: boolean) => void;
}
const StockStatus = ({
  setIsMaterialStockStatusModalOpen,
}: StockStatusProps) => {
  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
        <p className="flex-1 px-3 text-sv">자재명</p>
        <p className="flex-1 px-3 text-sv">자재 코드</p>
        <p className="flex-1 px-3 text-sv">투입 수량</p>
        <p className="w-[80px] px-3 text-sv">단위</p>
        <p className="flex-1 px-3 text-sv">재고 상태</p>
        <p className="flex-1 px-3 text-sv">입고 일자</p>
      </div>
      <StockStatusItem
        materialName="알루미늄 시트"
        materialCode="PRM-001"
        inputQuantity="2.0"
        unit="m"
        status="충분"
        date="2026-07-09"
        setIsMaterialStockStatusModalOpen={setIsMaterialStockStatusModalOpen}
      />
      <StockStatusItem
        materialName="투명 필름지"
        materialCode="PRM-014"
        inputQuantity="1.2"
        unit="m"
        status="부족"
        date="2026-07-05"
        setIsMaterialStockStatusModalOpen={setIsMaterialStockStatusModalOpen}
      />
      <StockStatusItem
        materialName="고강도 플리카보 고강도 플리카보"
        materialCode="PRM-001"
        inputQuantity="3.5"
        unit="m"
        status="충분"
        date="2026-07-01"
        setIsMaterialStockStatusModalOpen={setIsMaterialStockStatusModalOpen}
      />
    </div>
  );
};

export default StockStatus;
