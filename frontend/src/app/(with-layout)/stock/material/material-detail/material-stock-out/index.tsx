import { MaterialStockOutItem } from './material-stock-out-item';
import { useMaterialUsagePaginatedQuery } from '@/hooks/stock/material/use-material-usage';
import { NoHistoryBox } from '@/ui';
import { useState } from 'react';
import Pagination from '@/components/pagination';

interface MaterialStockOutProps {
  materialId: number;
}

const PAGE_SIZE = 5;

export const MaterialStockOut = ({ materialId }: MaterialStockOutProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useMaterialUsagePaginatedQuery({
    materialId,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  const usageList = data?.data || [];
  const totalPages = data?.pageCnt || 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 flex items-center justify-between">
        <h3 className="Heading-3 text-dg">원자재 사용 내역</h3>
      </div>

      {/* 표 헤더 부분 */}
      <div className="flex flex-col">
        {isLoading || error ? (
          <div className="h-50" />
        ) : usageList.length > 0 ? (
          <>
            <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
              <p className="flex-1 px-3 text-sv">처리일자</p>
              <p className="flex-1 px-3 text-sv">생산지시서</p>
              <p className="flex-1 px-3 text-sv">제품명</p>
              <p className="flex-1 px-3 text-sv">적용 LOT</p>
              <p className="flex-1 px-3 text-sv">사용량</p>
            </div>
            {usageList.map((usage) => (
              <MaterialStockOutItem key={usage.id} usage={usage} />
            ))}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <NoHistoryBox
            title="아직 사용 내역이 없어요."
            text="원자재가 사용되면 이곳에서 확인할 수 있어요."
          />
        )}
      </div>
    </div>
  );
};
