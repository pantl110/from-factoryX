'use client';

import { useTranslations } from 'next-intl';
import { MonthlyProfitDetailModel } from '@/types/data-model';
import Spinner from '@/ui/spinner';
import MonthProfitChart from './month-profit-chart';
import { ProfitPeriodModel } from './period-range-picker';
import RangeSectionHeader from './range-section-header';

const CHART_BOX =
  'border border-lg rounded-lg p-6 h-[320px] shadow-[2px_2px_22px_rgba(0,0,0,0.1)]';

interface MonthTrendSectionProps {
  rows: MonthlyProfitDetailModel[];
  isLoading: boolean;
  period: ProfitPeriodModel;
  lastYearRows?: MonthlyProfitDetailModel[];
}

const MonthTrendSection = ({
  rows,
  isLoading,
  period,
  lastYearRows,
}: MonthTrendSectionProps) => {
  const t = useTranslations('dashboard.profitDetail');

  return (
    <div className="flex flex-col gap-3">
      <RangeSectionHeader title={t('trendTitle')} period={period} />
      {isLoading ? (
        <div className={`${CHART_BOX} flex items-center justify-center`}>
          <Spinner />
        </div>
      ) : (
        <div className={CHART_BOX}>
          <MonthProfitChart rows={rows} lastYearRows={lastYearRows} />
        </div>
      )}
    </div>
  );
};

export default MonthTrendSection;
