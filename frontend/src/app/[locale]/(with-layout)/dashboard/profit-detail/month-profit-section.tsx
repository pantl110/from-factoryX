'use client';

import { useTranslations } from 'next-intl';
import { MonthlyProfitDetailModel } from '@/types/data-model';
import MonthProfitChart from './month-profit-chart';
import MonthProfitTable from './month-profit-table';

interface MonthProfitSectionProps {
  rows: MonthlyProfitDetailModel[];
  chartBoxClassName: string;
}

const MonthProfitSection = ({
  rows,
  chartBoxClassName,
}: MonthProfitSectionProps) => {
  const t = useTranslations('dashboard.profitDetail');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3">{t('trendTitle')}</h3>
        <div className={chartBoxClassName}>
          <MonthProfitChart rows={rows} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3">{t('monthDetailTitle')}</h3>
        <MonthProfitTable rows={rows} />
      </div>
    </div>
  );
};

export default MonthProfitSection;
