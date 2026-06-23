'use client';

import { useTranslations } from 'next-intl';
import { ProfitDetailResponseModel } from '@/types/data-model';
import { formatMoney, formatRate } from './utils';

interface ProfitSummaryCardsProps {
  data: ProfitDetailResponseModel;
}

interface CardProps {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
}

const Card = ({ label, value, valueColor = 'text-dg', sub }: CardProps) => (
  <div className="flex-1 pt-5 pb-4 px-5 rounded-lg border border-lg shadow-[2px_2px_22px_rgba(0,0,0,0.1)]">
    <p className="Heading-4 text-sv">{label}</p>
    <p className={`mt-2 Heading-2 ${valueColor}`}>{value}</p>
    {sub && <p className="mt-1 Re_Body-1 text-sv">{sub}</p>}
  </div>
);

const ProfitSummaryCards = ({ data }: ProfitSummaryCardsProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const won = t('won');

  return (
    <div className="flex gap-4">
      <Card
        label={t('totalRevenue')}
        value={`${formatMoney(data.total_revenue)}${won}`}
      />
      <Card
        label={t('materialCost')}
        value={`${formatMoney(data.total_material_cost)}${won}`}
        valueColor="text-sv"
        sub={t('materialCostBasis')}
      />
      <Card
        label={t('totalProfit')}
        value={`${formatMoney(data.total_profit)}${won}`}
        valueColor="text-primary"
      />
      <Card
        label={t('profitRate')}
        value={formatRate(data.total_profit_rate)}
        valueColor="text-primary"
      />
    </div>
  );
};

export default ProfitSummaryCards;
