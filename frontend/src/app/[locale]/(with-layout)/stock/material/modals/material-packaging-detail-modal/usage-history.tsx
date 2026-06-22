import { useTranslations } from 'next-intl';
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
  const t = useTranslations(
    'stock.material.modals.packagingDetail.usageHistory'
  );
  const tStockOut = useTranslations('stock.material.stockOut.tableHeader');
  const tCommon = useTranslations('common');
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
      <h4 className="Heading-4">{t('title')}</h4>
      <div>
        {isLoading || error ? (
          <div className="h-50" />
        ) : usageList.length > 0 ? (
          <>
            <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 cursor-default">
              <p className="flex-1 px-3 text-sv">{tStockOut('processDate')}</p>
              <div className="flex-1 px-3 flex items-center justify-between">
                <p className="text-sv">{tCommon('clientName')}</p>
              </div>
              <p className="flex-1 px-3 text-sv">{tCommon('productName')}</p>
              <p className="flex-1 px-3 text-sv">{t('tableHeader.usage')}</p>
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
            title={t('empty.title')}
            text={t('empty.description')}
          />
        )}
      </div>
    </div>
  );
};
