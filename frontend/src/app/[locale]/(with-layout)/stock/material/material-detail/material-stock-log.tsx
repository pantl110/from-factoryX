import { useState } from 'react';
import MaterialStockLogItem from './material-stock-log-item';
import { NoHistoryBox } from '@/ui';
import Pagination from '@/components/pagination';
import { MaterialHistoryResponseModel } from '@/types/data-model';

interface MaterialStockLogProps {
  histories?: MaterialHistoryResponseModel[];
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const MaterialStockLog = ({
  histories,
  isLoading,
  currentPage: propCurrentPage,
  totalPages,
  onPageChange,
}: MaterialStockLogProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      setCurrentPage(page);
    }
  };

  if (isLoading || !histories || histories.length === 0) {
    return (
      <NoHistoryBox
        title="아직 등록된 재고 이력이 없어요."
        text="입고나 출고와 관련된 재고 이력이 등록되면 이곳에서 확인할 수 있어요."
      />
    );
  }

  return (
    <>
      {/* 재고 이력 테이블 */}
      <div className="flex flex-col">
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
          <p className="flex-1 py-1 px-3 text-sv">처리일자</p>
          <p className="flex-1 py-1 px-3 text-sv">상태</p>
          <p className="flex-1 py-1 px-3 text-sv">수량</p>
          <p className="flex-1 py-1 px-3 text-sv">현재 재고</p>
          <p className="flex-1 py-1 px-3 text-sv">매입 세금계산서</p>
          <p className="flex-1 py-1 px-3 text-sv">현금 영수증</p>
        </div>

        <div className="min-h-[340px]">
          {histories.map((history) => (
            <MaterialStockLogItem key={history.id} data={history} />
          ))}

          {/* 페이지네이션 */}
          {totalPages && totalPages > 1 && (
            <Pagination
              currentPage={propCurrentPage || currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default MaterialStockLog;
