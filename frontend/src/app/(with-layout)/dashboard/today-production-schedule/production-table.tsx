import ProductionTableHeader from './production-table-header';
import ProductionTableItem from './production-table-item';
import NoHistoryBox from '@/ui/no-history-box';
import { usePagination } from '@/hooks';
import Pagination from '@/components/pagination';

interface TodayProductionPlanModel {
  company_name: string;
  product_name: string;
  product_code: string;
  spec: string;
  unit: string;
  production_quantity: number;
  equipment_name: string;
  production_time: number;
  project_id: number;
}

interface ProductionTableProps {
  todayProductionPlans: TodayProductionPlanModel[];
  isLoading: boolean;
}

const ProductionTable = ({
  todayProductionPlans,
  isLoading,
}: ProductionTableProps) => {
  // 생산 시간을 시:분 형식으로 변환
  const formatProductionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // usePagination 훅 사용
  const { currentItems, currentPage, totalPages, setCurrentPage } =
    usePagination({
      items: todayProductionPlans,
      itemsPerPage: 5,
    });

  if (isLoading || todayProductionPlans.length === 0) {
    return (
      <div className="mt-3">
        <NoHistoryBox
          title="히스토리가 아직 없어요."
          text="오늘 생산할 품목을 여기에서 확인할 수 있어요."
        />
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 overflow-x-auto h-[328px] scrollbar-hide">
        <ProductionTableHeader />
        {currentItems.map((item, index) => (
          <ProductionTableItem
            key={`${item.project_id}-${index}`}
            companyName={item.company_name}
            productName={item.product_name}
            productCode={item.product_code}
            size={item.spec}
            unit={item.unit}
            quantity={item.production_quantity}
            machine={item.equipment_name}
            time={formatProductionTime(item.production_time)}
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
  );
};

export default ProductionTable;
