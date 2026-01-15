'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('dashboard.todayProductionSchedule');

  // usePagination 훅 사용
  const { currentItems, currentPage, totalPages, setCurrentPage } =
    usePagination({
      items: todayProductionPlans,
      itemsPerPage: 5,
    });

  if (isLoading || todayProductionPlans.length === 0) {
    return (
      <div className="mt-3 h-full">
        <NoHistoryBox
          title={t('noHistory')}
          text={t('noHistoryDescription')}
          height="h-full"
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
