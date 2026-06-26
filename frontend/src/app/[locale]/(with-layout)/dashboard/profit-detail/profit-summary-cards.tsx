'use client';

import { useTranslations } from 'next-intl';
import { Info } from '@phosphor-icons/react';
import { useTooltip } from '@/hooks';
import Tooltip from '@/ui/tooltip';
import { ProfitSummaryResponseModel } from '@/types/data-model';
import { formatMoney, formatRate } from './utils';

interface ProfitSummaryCardsProps {
  data: ProfitSummaryResponseModel;
}

interface CardProps {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
  tooltip?: string;
}

const Card = ({
  label,
  value,
  valueColor = 'text-dg',
  sub,
  tooltip,
}: CardProps) => {
  const { onMouseEnter, onMouseLeave, isVisible } = useTooltip({});

  return (
    <div className="flex-1 pt-5 pb-4 px-5 rounded-lg border border-lg shadow-[2px_2px_22px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-1">
        <p className="Heading-4 text-sv">{label}</p>
        {tooltip && (
          <div
            className="relative"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <Info size={16} className="text-gr cursor-help" />
            {isVisible && (
              <div className="absolute z-10 bottom-7 -left-2 w-[300px]">
                <Tooltip
                  text={tooltip}
                  color="black"
                  position="left"
                  arrow="bottom"
                />
              </div>
            )}
          </div>
        )}
      </div>
      <p className={`mt-2 Heading-2 ${valueColor}`}>{value}</p>
      {sub && <p className="mt-1 Re_Body-1 text-sv">{sub}</p>}
    </div>
  );
};

const ProfitSummaryCards = ({ data }: ProfitSummaryCardsProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const won = t('won');

  return (
    <div className="flex gap-4">
      <Card
        label={t('totalRevenue')}
        value={`${formatMoney(data.revenue)}${won}`}
        tooltip={t('revenueBasisTooltip')}
      />
      <Card
        label={t('materialCost')}
        value={`${formatMoney(data.material_cost)}${won}`}
        valueColor="text-sv"
        sub={t('materialCostBasis')}
        tooltip={t('subtitle')}
      />
      <Card
        label={t('totalProfit')}
        value={`${formatMoney(data.profit)}${won}`}
        valueColor="text-primary"
      />
      <Card
        label={t('profitRate')}
        value={formatRate(data.profit_rate)}
        valueColor="text-primary"
      />
    </div>
  );
};

export default ProfitSummaryCards;
