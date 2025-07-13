import ProductStockLogItem from './product-stock-log-item'

interface ProductStockLogProps {
  setIsProductStockModalOpen: (v: boolean) => void
}

const ProductStockLog = ({ setIsProductStockModalOpen }: ProductStockLogProps) => {
  return (
    <>
      <div>
        <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
          <p className="w-[150px] py-1 px-3 text-sv">처리일자</p>
          <p className="w-[150px] py-1 px-3 text-sv">상태</p>
          <p className="flex-1 py-1 px-3 text-sv">수량</p>
          <p className="flex-1 py-1 px-3 text-sv">현재 재고</p>
        </div>

        <ProductStockLogItem
          date="2025-06-13"
          status="생산"
          amount={2000}
          total={3500}
          onClick={() => setIsProductStockModalOpen(true)}
        />
        <ProductStockLogItem
          date="2025-06-13"
          status="납품 출고"
          amount={2000}
          total={3500}
          onClick={() => setIsProductStockModalOpen(true)}
        />
      </div>
    </>
  )
}

export default ProductStockLog
