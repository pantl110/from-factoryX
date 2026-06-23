'use client';

import { useTranslations } from 'next-intl';
import { formatMoney, formatRate } from './utils';

interface ProfitStatRowProps {
  revenue: number;
  materialCost: number;
  profit: number;
  profitRate: number;
}

const Stat = ({
  label,
  value,
  valueColor = 'text-dg',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <div className="flex-1 pt-4 pb-3 px-4 rounded-lg border border-lg">
    <p className="Re_Body-1 text-sv">{label}</p>
    <p className={`mt-1 Heading-3 ${valueColor}`}>{value}</p>
  </div>
);

const ProfitStatRow = ({
  revenue,
  materialCost,
  profit,
  profitRate,
}: ProfitStatRowProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const won = t('won');

  return (
    <div className="flex gap-3">
      <Stat label={t('totalRevenue')} value={`${formatMoney(revenue)}${won}`} />
      <Stat
        label={t('materialCost')}
        value={`${formatMoney(materialCost)}${won}`}
        valueColor="text-sv"
      />
      <Stat
        label={t('totalProfit')}
        value={`${formatMoney(profit)}${won}`}
        valueColor="text-primary"
      />
      <Stat
        label={t('profitRate')}
        value={formatRate(profitRate)}
        valueColor="text-primary"
      />
    </div>
  );
};

export default ProfitStatRow;
