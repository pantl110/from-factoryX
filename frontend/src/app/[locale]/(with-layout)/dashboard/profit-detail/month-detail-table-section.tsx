'use client';

import { useTranslations } from 'next-intl';
import { MonthlyProfitDetailModel } from '@/types/data-model';
import MonthProfitTable from './month-profit-table';
import { ProfitPeriodModel } from './period-range-picker';
import RangeSectionHeader from './range-section-header';
import SectionLoading from './section-loading';

interface MonthDetailTableSectionProps {
  rows: MonthlyProfitDetailModel[];
  isLoading: boolean;
  period: ProfitPeriodModel;
  onSelectMonth?: (row: MonthlyProfitDetailModel) => void;
}

const MonthDetailTableSection = ({
  rows,
  isLoading,
  period,
  onSelectMonth,
}: MonthDetailTableSectionProps) => {
  const t = useTranslations('dashboard.profitDetail');

  return (
    <div className="flex flex-col gap-3">
      <RangeSectionHeader title={t('monthDetailTitle')} period={period} />
      {isLoading ? (
        <SectionLoading height="h-[200px]" />
      ) : (
        <MonthProfitTable rows={rows} onSelect={onSelectMonth} />
      )}
    </div>
  );
};

export default MonthDetailTableSection;
