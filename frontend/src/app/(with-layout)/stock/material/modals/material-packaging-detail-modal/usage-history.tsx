import { UsageHistoryItem } from './usage-history-item';
import { useMaterialUsagePaginatedQuery } from '@/hooks/stock/material/use-material-usage';
import { NoHistoryBox } from '@/ui';
import Pagination from '@/components/pagination';
import { useState } from 'react';

interface UsageHistoryProps {
  repackagingId: number;
}

const PAGE_SIZE = 5;

export const UsageHistory = ({ repackagingId }: UsageHistoryProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useMaterialUsagePaginatedQuery({
    materialRepackagingId: repackagingId,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  const usageList = data?.data || [];
  const totalPages = data?.pageCnt || 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="mt-5 flex flex-col gap-3">
      <h4 className="Heading-4">소분된 원자재 사용 내역</h4>
      <div>
        {isLoading || error ? (
          <div className="h-50" />
        ) : usageList.length > 0 ? (
          <>
            <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
              <p className="flex-1 px-3 text-sv">처리일자</p>
              <p className="flex-1 px-3 text-sv">생산지시서</p>
              <p className="flex-1 px-3 text-sv">제품명</p>
              <p className="flex-1 px-3 text-sv">자재 사용량</p>
            </div>
            {usageList.map((usage) => (
              <UsageHistoryItem key={usage.id} usage={usage} />
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
            text="소분된 원자재가 사용되면 이곳에서 확인할 수 있어요."
          />
        )}
      </div>
    </div>
  );
};
