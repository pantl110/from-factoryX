'use client';

import { useTranslations } from 'next-intl';
import Spinner from '@/ui/spinner';
import MonthProfitChart from './month-profit-chart';
import { ProfitPeriodModel } from './period-range-picker';
import RangeSectionHeader from './range-section-header';
import useProfitTrend from './use-profit-trend';

const CHART_BOX =
  'border border-lg rounded-lg p-6 h-[320px] shadow-[2px_2px_22px_rgba(0,0,0,0.1)]';

interface MonthTrendSectionProps {
  period: ProfitPeriodModel;
  clientId?: string;
}

const MonthTrendSection = ({ period, clientId }: MonthTrendSectionProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const { data, isLoading } = useProfitTrend({
    from: period.from,
    to: period.to,
    clientId,
  });

  return (
    <div className="flex flex-col gap-3">
      <RangeSectionHeader title={t('trendTitle')} period={period} />
      {isLoading ? (
        <div className={`${CHART_BOX} flex items-center justify-center`}>
          <Spinner />
        </div>
      ) : (
        <div className={CHART_BOX}>
          <MonthProfitChart
            rows={data?.by_month ?? []}
            lastYearRows={data?.by_month_last_year}
          />
        </div>
      )}
    </div>
  );
};

export default MonthTrendSection;
