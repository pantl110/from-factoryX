import { useState } from 'react';
import Pagination from '@/components/pagination';
import ProductionTableHeader from './production-table-header';
import ProductionTableItem from './production-table-item';
import Spinner from '@/ui/spinner';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 생산 시간을 시:분 형식으로 변환
  const formatProductionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // 페이지네이션 계산
  const itemsPerPage = 5;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = todayProductionPlans.slice(startIndex, endIndex);
  const calculatedTotalPages = Math.ceil(
    todayProductionPlans.length / itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="mt-3 flex items-center justify-center h-[328px]">
        <Spinner />
      </div>
    );
  }

  if (todayProductionPlans.length === 0) {
    return (
      <div className="mt-3 flex items-center justify-center h-[328px]">
        <div className="text-gr">오늘의 생산 일정이 없습니다.</div>
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
      {calculatedTotalPages > 1 && (
        <div className="flex justify-center mt-3">
          <Pagination
            currentPage={currentPage}
            totalPages={calculatedTotalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
};

export default ProductionTable;
