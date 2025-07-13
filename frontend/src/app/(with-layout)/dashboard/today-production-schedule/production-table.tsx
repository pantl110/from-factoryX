import Pagination from '@/components/pagination'
import usePagination from '@/hooks/use-pagination'
import ProductionTableHeader from './production-table-header'
import ProductionTableItem from './production-table-item'

// 생산 일정 데이터
const productionScheduleData = [
  {
    id: 1,
    companyName: '플라스틱이 좋아',
    productName: 'A품목',
    productCode: 'P-001',
    size: '500ml',
    unit: 'EA',
    quantity: 5000,
    machine: '1호기',
    time: '09:00-13:00',
  },
  {
    id: 2,
    companyName: '플라스틱 마스터',
    productName: 'A품목',
    productCode: 'P-001',
    size: '500ml',
    unit: 'EA',
    quantity: 5000,
    machine: '1호기',
    time: '09:00-13:00',
  },
  {
    id: 3,
    companyName: '플라스틱 프로',
    productName: 'A품목',
    productCode: 'P-001',
    size: '500ml',
    unit: 'EA',
    quantity: 5000,
    machine: '1호기',
    time: '09:00-13:00',
  },
  {
    id: 4,
    companyName: '플라스틱 엑스퍼트',
    productName: 'A품목',
    productCode: 'P-001',
    size: '500ml',
    unit: 'EA',
    quantity: 5000,
    machine: '1호기',
    time: '09:00-13:00',
  },
  {
    id: 5,
    companyName: '플라스틱 스페셜',
    productName: 'B품목',
    productCode: 'P-002',
    size: '1L',
    unit: 'EA',
    quantity: 3000,
    machine: '2호기',
    time: '14:00-18:00',
  },
  {
    id: 6,
    companyName: '플라스틱 프리미엄',
    productName: 'C품목',
    productCode: 'P-003',
    size: '250ml',
    unit: 'EA',
    quantity: 8000,
    machine: '3호기',
    time: '19:00-23:00',
  },
  {
    id: 7,
    companyName: '플라스틱 베스트',
    productName: 'D품목',
    productCode: 'P-004',
    size: '750ml',
    unit: 'EA',
    quantity: 2000,
    machine: '1호기',
    time: '08:00-12:00',
  },
  {
    id: 8,
    companyName: '플라스틱 퍼펙트',
    productName: 'E품목',
    productCode: 'P-005',
    size: '2L',
    unit: 'EA',
    quantity: 1500,
    machine: '2호기',
    time: '13:00-17:00',
  },
]

const ProductionTable = () => {
  // 페이지네이션 훅 사용
  const {
    currentItems: currentProductions,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination({
    items: productionScheduleData,
    itemsPerPage: 5, // 페이지당 5개 항목
  })

  return (
    <>
      <div className="mt-3 overflow-x-auto h-[328px]">
        <ProductionTableHeader />
        {currentProductions.map((item) => (
          <ProductionTableItem
            key={item.id}
            companyName={item.companyName}
            productName={item.productName}
            productCode={item.productCode}
            size={item.size}
            unit={item.unit}
            quantity={item.quantity}
            machine={item.machine}
            time={item.time}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  )
}

export default ProductionTable
