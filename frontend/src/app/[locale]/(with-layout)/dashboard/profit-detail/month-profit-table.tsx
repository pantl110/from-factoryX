'use client';

import { useTranslations } from 'next-intl';
import { MonthlyProfitDetailModel } from '@/types/data-model';
import { usePagination } from '@/hooks';
import Pagination from '@/components/pagination';
import { ProfitValueHeaderCells } from './profit-table-cells';
import { TABLE_PAGE_SIZE } from './utils';
import MonthProfitTableItem from './month-profit-table-item';

interface MonthProfitTableProps {
  rows: MonthlyProfitDetailModel[];
  onSelect?: (row: MonthlyProfitDetailModel) => void;
}

const MonthProfitTable = ({ rows, onSelect }: MonthProfitTableProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const sorted = [...rows].sort((a, b) => b.month.localeCompare(a.month));
  const { currentItems, currentPage, totalPages, setCurrentPage } =
    usePagination({ items: sorted, itemsPerPage: TABLE_PAGE_SIZE });

  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm cursor-default">
        <p className="px-3 flex-1">{t('colMonth')}</p>
        <ProfitValueHeaderCells />
      </div>
      {currentItems.map((row) => (
        <MonthProfitTableItem key={row.month} row={row} onSelect={onSelect} />
      ))}
      {totalPages > 1 && (
        <div className="flex justify-center mt-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default MonthProfitTable;
