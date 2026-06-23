'use client';

import { useTranslations } from 'next-intl';
import { ArrowLineUpRight } from '@phosphor-icons/react';
import { RoundChip } from '@/ui/round-chip';
import IconBtn from '@/ui/icon-btn';
import { formatMoney, formatRate } from './utils';

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
}: NameShortcutCellProps) => (
  <div className="flex-1 px-3 flex items-center justify-between gap-1 min-w-0">
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

export const ProfitValueHeaderCells = () => {
  const t = useTranslations('dashboard.profitDetail');
  return (
    <>
      <p className="px-3 flex-1">{t('colRevenue')}</p>
      <p className="px-3 flex-1">{t('colMaterialCost')}</p>
      <p className="px-3 flex-1">{t('colProfit')}</p>
      <p className="px-3 flex-1">{t('colProfitRate')}</p>
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
      <p className="px-3 flex-1">
        {formatMoney(materialCost)}
        {t('won')}
      </p>
      <p className="px-3 flex-1">
        {formatMoney(profit)}
        {t('won')}
      </p>
      <p className="px-3 flex-1">{formatRate(profitRate)}</p>
    </>
  );
};
