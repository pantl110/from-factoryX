'use client';

import { useTranslations } from 'next-intl';
import { MonthlyProfitDetailModel } from '@/types/data-model';
import { parseMonth } from './utils';
import { EstimatedChip, ProfitValueCells } from './profit-table-cells';

interface MonthProfitTableItemProps {
  row: MonthlyProfitDetailModel;
  onSelect?: (row: MonthlyProfitDetailModel) => void;
}

const MonthProfitTableItem = ({ row, onSelect }: MonthProfitTableItemProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const { year, month } = parseMonth(row.month);

  return (
    <div
      onClick={onSelect ? () => onSelect(row) : undefined}
      className={`h-14 flex items-center Me_Body-3 text-dg border-b border-lg ${
        onSelect
          ? 'cursor-pointer hover:bg-bg transition-colors ease-in-out duration-200'
          : 'cursor-default'
      }`}
    >
      <div className="flex items-center gap-2 px-3 flex-1 min-w-0">
        <span className="truncate">{t('monthLabel', { year, month })}</span>
        {row.is_estimated && <EstimatedChip />}
      </div>
      <ProfitValueCells {...row} />
    </div>
  );
};

export default MonthProfitTableItem;
