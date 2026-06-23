'use client';

import { useTranslations } from 'next-intl';
import { MonthlyProfitDetailModel } from '@/types/data-model';
import { ProfitValueHeaderCells } from './profit-table-cells';
import MonthProfitTableItem from './month-profit-table-item';

interface MonthProfitTableProps {
  rows: MonthlyProfitDetailModel[];
}

const MonthProfitTable = ({ rows }: MonthProfitTableProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const sorted = [...rows].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm cursor-default">
        <p className="px-3 flex-1">{t('colMonth')}</p>
        <ProfitValueHeaderCells />
      </div>
      {sorted.map((row) => (
        <MonthProfitTableItem key={row.month} row={row} />
      ))}
    </div>
  );
};

export default MonthProfitTable;
