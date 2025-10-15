import ProductionTableHeader from './production-table-header';
import ProductionTableItem from './production-table-item';
import NoHistoryBox from '@/ui/no-history-box';
import { usePagination } from '@/hooks';
import Pagination from '@/components/pagination';
import { TodayProductionPlanModel } from '../type';

interface ProductionTableProps {
  todayProductionPlans: TodayProductionPlanModel[];
  isLoading: boolean;
}

const ProductionTable = ({
  todayProductionPlans,
  isLoading,
}: ProductionTableProps) => {
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
          text="오늘 생산할 제품을 여기에서 확인할 수 있어요."
        />
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 overflow-x-auto">
        <ProductionTableHeader />
        {currentItems.map((item, index) => (
          <ProductionTableItem
            key={`${item.project_id}-${index}`}
            item={item}
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
