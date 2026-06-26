'use client';

import { useTranslations } from 'next-intl';
import {
  MonthlyProfitDetailModel,
  ProfitListScopeType,
} from '@/types/data-model';
import {
  ProfitValueHeaderCells,
  SortableHeaderCell,
} from './profit-table-cells';
import MonthProfitTableItem from './month-profit-table-item';
import SectionLoading from './section-loading';
import TablePagination from './table-pagination';
import useProfitList from './use-profit-list';

interface MonthProfitTableProps {
  scope: ProfitListScopeType;
  from: string;
  to: string;
  parentId?: string;
  onSelect?: (row: MonthlyProfitDetailModel) => void;
}

const MonthProfitTable = ({
  scope,
  from,
  to,
  parentId,
  onSelect,
}: MonthProfitTableProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const { rows, totalPages, page, setPage, isLoading, sort } =
    useProfitList<MonthlyProfitDetailModel>({
      scope,
      from,
      to,
      parentId,
      defaultSort: 'month',
    });

  if (isLoading) {
    return <SectionLoading height="h-[200px]" />;
  }

  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm">
        <SortableHeaderCell
          label={t('colMonth')}
          columnKey="month"
          widthClass="flex-1"
          sort={sort}
        />
        <ProfitValueHeaderCells sort={sort} />
      </div>
      {rows.map((row) => (
        <MonthProfitTableItem key={row.month} row={row} onSelect={onSelect} />
      ))}
      <TablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default MonthProfitTable;
