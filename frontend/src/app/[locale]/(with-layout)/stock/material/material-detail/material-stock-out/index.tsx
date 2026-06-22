import { useTranslations } from 'next-intl';
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
  const t = useTranslations('stock.material.stockOut');
  const tCommon = useTranslations('common');
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
        <h3 className="Heading-3 text-dg">{t('title')}</h3>
      </div>

      {/* 표 헤더 부분 */}
      <div className="flex flex-col">
        {isLoading || error ? (
          <div className="h-50" />
        ) : usageList.length > 0 ? (
          <>
            <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 cursor-default">
              <p className="flex-1 px-3 text-sv">
                {t('tableHeader.processDate')}
              </p>
              <p className="flex-1 px-3 text-sv">{tCommon('clientName')}</p>
              <p className="flex-1 px-3 text-sv">{tCommon('productName')}</p>
              <p className="flex-1 px-3 text-sv">
                {t('tableHeader.appliedLot')}
              </p>
              <p className="flex-1 px-3 text-sv">{t('tableHeader.usage')}</p>
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
            title={t('empty.title')}
            text={t('empty.description')}
          />
        )}
      </div>
    </div>
  );
};
