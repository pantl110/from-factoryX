import { useEffect, useState } from 'react';
import Pagination from '@/components/pagination';
import ProductionTableHeader from './production-table-header';
import ProductionTableItem from './production-table-item';
import useGetTodayProductionPlans from '@/hooks/project/use-get-today-production-plans';
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

const ProductionTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [productionPlans, setProductionPlans] = useState<
    TodayProductionPlanModel[]
  >([]);
  const [totalPages, setTotalPages] = useState(1);
  const { getTodayProductionPlans, isLoading, error } =
    useGetTodayProductionPlans();

  useEffect(() => {
    const fetchTodayProductionPlans = async () => {
      const result = await getTodayProductionPlans({
        page: currentPage,
      });

      if (result.success && result.data) {
        setProductionPlans(result.data);
        // API에서 페이지 정보를 받아와서 설정 (임시로 1페이지당 5개로 계산)
        setTotalPages(Math.ceil(result.data.length / 5));
      } else {
        console.error('오늘의 생산 일정 조회 실패:', result.error);
        setProductionPlans([]);
        setTotalPages(1);
      }
    };

    fetchTodayProductionPlans();
  }, [currentPage, getTodayProductionPlans]);

  // 생산 시간을 시:분 형식으로 변환
  const formatProductionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="mt-3 flex items-center justify-center h-[328px]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 flex items-center justify-center h-[328px]">
        <div className="text-red-500">에러: {error}</div>
      </div>
    );
  }

  if (productionPlans.length === 0) {
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
        {productionPlans.map((item, index) => (
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
