'use client';

import { useTranslations } from 'next-intl';
import { ArrowLineUpRight, CaretUpDown } from '@phosphor-icons/react';
import { RoundChip } from '@/ui/round-chip';
import IconBtn from '@/ui/icon-btn';
import { formatMoney, formatRate } from './utils';

export type ProfitSortKeyType =
  | 'month'
  | 'client_name'
  | 'product_name'
  | 'quantity'
  | 'revenue'
  | 'material_cost'
  | 'profit'
  | 'profit_rate';

export interface ProfitSortConfigModel {
  sortKey: ProfitSortKeyType;
  sortOrder: 'asc' | 'desc';
  onSort: (key: ProfitSortKeyType) => void;
}

export const SortableHeaderCell = ({
  label,
  columnKey,
  widthClass,
  sort,
}: {
  label: string;
  columnKey: ProfitSortKeyType;
  widthClass: string;
  sort?: ProfitSortConfigModel;
}) => {
  if (!sort) {
    return <p className={`px-3 ${widthClass}`}>{label}</p>;
  }
  return (
    <div
      className={`px-3 ${widthClass} h-full flex items-center gap-1 hover:bg-bg cursor-pointer`}
      onClick={() => sort.onSort(columnKey)}
    >
      <p>{label}</p>
      <CaretUpDown size={18} className="text-sv" />
    </div>
  );
};

interface ProfitValueCellsProps {
  revenue: number;
  material_cost: number;
  profit: number;
  profit_rate: number;
}

interface NameShortcutCellProps {
  name: string;
  isEstimated?: boolean;
  onShortcut: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  widthClass?: string;
}

export const EstimatedChip = () => {
  const t = useTranslations('dashboard.profitDetail');
  return (
    <span className="shrink-0 whitespace-nowrap">
      <RoundChip text={t('estimated')} variant="sm" color="gray" />
    </span>
  );
};

export const NameShortcutCell = ({
  name,
  isEstimated,
  onShortcut,
  widthClass = 'flex-1',
}: NameShortcutCellProps) => (
  <div
    className={`${widthClass} px-3 flex items-center justify-between gap-1 min-w-0`}
  >
    <div className="flex items-center gap-2 min-w-0">
      <p className="text-dg truncate" title={name}>
        {name}
      </p>
      {isEstimated && <EstimatedChip />}
    </div>
    <IconBtn
      icon={ArrowLineUpRight}
      size="w-9 h-9"
      iconSize={16}
      onClick={onShortcut}
    />
  </div>
);

export const ProfitValueHeaderCells = ({
  sort,
}: {
  sort?: ProfitSortConfigModel;
}) => {
  const t = useTranslations('dashboard.profitDetail');
  return (
    <>
      <SortableHeaderCell
        label={t('colRevenue')}
        columnKey="revenue"
        widthClass="flex-1"
        sort={sort}
      />
      <SortableHeaderCell
        label={t('colMaterialCost')}
        columnKey="material_cost"
        widthClass="flex-1"
      />
      <SortableHeaderCell
        label={t('colProfit')}
        columnKey="profit"
        widthClass="flex-1"
        sort={sort}
      />
      <SortableHeaderCell
        label={t('colProfitRate')}
        columnKey="profit_rate"
        widthClass="flex-[0.8]"
        sort={sort}
      />
    </>
  );
};

export const ProfitValueCells = ({
  revenue,
  material_cost: materialCost,
  profit,
  profit_rate: profitRate,
}: ProfitValueCellsProps) => {
  const t = useTranslations('dashboard.profitDetail');
  return (
    <>
      <p className="px-3 flex-1">
        {formatMoney(revenue)}
        {t('won')}
      </p>
      <p className="px-3 flex-1 text-red">
        {formatMoney(materialCost)}
        {t('won')}
      </p>
      <p className="px-3 flex-1 text-blue">
        {formatMoney(profit)}
        {t('won')}
      </p>
      <p className="px-3 flex-[0.8]">{formatRate(profitRate)}</p>
    </>
  );
};
