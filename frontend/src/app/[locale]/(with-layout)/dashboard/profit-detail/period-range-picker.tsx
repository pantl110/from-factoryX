'use client';

import { useTranslations } from 'next-intl';
import YearMonthPicker from './year-month-picker';

export interface ProfitPeriodModel {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

interface PeriodRangePickerProps extends ProfitPeriodModel {
  align?: 'left' | 'right';
}

const PeriodRangePicker = ({
  from,
  to,
  onFromChange,
  onToChange,
  align = 'right',
}: PeriodRangePickerProps) => {
  const t = useTranslations('dashboard.profitDetail');

  return (
    <div className="flex items-center gap-2">
      <YearMonthPicker
        value={from}
        onChange={onFromChange}
        max={to}
        align={align}
      />
      <span className="Re_Body-1 text-sv">{t('rangeSeparator')}</span>
      <YearMonthPicker
        value={to}
        onChange={onToChange}
        min={from}
        align={align}
      />
    </div>
  );
};

export default PeriodRangePicker;
