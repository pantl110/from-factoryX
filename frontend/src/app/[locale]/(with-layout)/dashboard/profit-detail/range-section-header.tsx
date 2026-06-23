'use client';

import PeriodRangePicker, { ProfitPeriodModel } from './period-range-picker';

interface RangeSectionHeaderProps {
  title: string;
  period: ProfitPeriodModel;
}

const RangeSectionHeader = ({ title, period }: RangeSectionHeaderProps) => (
  <div className="flex items-center justify-between">
    <h3 className="Heading-3">{title}</h3>
    <PeriodRangePicker
      from={period.from}
      to={period.to}
      onFromChange={(v) => period.onFromChange(v)}
      onToChange={(v) => period.onToChange(v)}
    />
  </div>
);

export default RangeSectionHeader;
