'use client';

import { useTranslations } from 'next-intl';
import {
  MonthlyProfitDetailModel,
  ProfitListScopeType,
} from '@/types/data-model';
import MonthProfitTable from './month-profit-table';
import { ProfitPeriodModel } from './period-range-picker';
import RangeSectionHeader from './range-section-header';

interface MonthDetailTableSectionProps {
  period: ProfitPeriodModel;
  scope: ProfitListScopeType;
  parentId?: string;
  onSelectMonth?: (row: MonthlyProfitDetailModel) => void;
}

const MonthDetailTableSection = ({
  period,
  scope,
  parentId,
  onSelectMonth,
}: MonthDetailTableSectionProps) => {
  const t = useTranslations('dashboard.profitDetail');

  return (
    <div className="flex flex-col gap-3">
      <RangeSectionHeader title={t('monthDetailTitle')} period={period} />
      <MonthProfitTable
        scope={scope}
        from={period.from}
        to={period.to}
        parentId={parentId}
        onSelect={onSelectMonth}
      />
    </div>
  );
};

export default MonthDetailTableSection;
