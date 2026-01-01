'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/ui';

interface ResultProps {
  unit: string;
  expectedUsage: number;
  totalUsage: number;
  hasSubstitute: boolean;
}

export const Result = ({
  unit,
  expectedUsage,
  totalUsage,
  hasSubstitute,
}: ResultProps) => {
  const t = useTranslations('production.result');
  const tCommon = useTranslations('common');
  const hasTotal = typeof totalUsage === 'number' && !Number.isNaN(totalUsage);
  const hasExpected =
    typeof expectedUsage === 'number' && !Number.isNaN(expectedUsage);

  const lossRatio =
    hasTotal && hasExpected && totalUsage > 0
      ? (totalUsage - expectedUsage) / totalUsage
      : null;

  const lossRateDisplay =
    lossRatio === null ? '-' : `${(lossRatio * 100).toFixed(1)}%`;

  const isDisabled = hasSubstitute;
  const theoryValue = isDisabled ? '-' : expectedUsage;
  const totalValue = isDisabled ? '-' : totalUsage;
  const unitValue = isDisabled ? '-' : unit;
  const lossValue = isDisabled ? '-' : lossRateDisplay;
  const inputBgClass = isDisabled ? 'bg-lg' : 'bg-white';

  return (
    <>
      <div className="mt-5 flex gap-2.5 bg-primary-8 rounded-[8px] p-4">
        <div className="flex-[0.6]">
          <Input
            label={t('theoreticalUsage')}
            disabledReadOnly
            placeholder="-"
            className={inputBgClass}
            value={theoryValue}
          />
        </div>
        <div className="flex-[0.4]">
          <Input
            label={tCommon('unit')}
            disabledReadOnly
            value={unitValue}
            className={`${inputBgClass} truncate`}
          />
        </div>
        <div className="flex-[0.6]">
          <Input
            label={t('totalInput')}
            disabledReadOnly
            placeholder="-"
            className={inputBgClass}
            value={totalValue}
          />
        </div>
        <div className="flex-[0.4]">
          <Input
            label={tCommon('unit')}
            disabledReadOnly
            value={unitValue}
            className={`${inputBgClass} truncate`}
          />
        </div>
        <div className="flex-1">
          <Input
            label={t('lossRate')}
            message={t('lossRateMessage')}
            disabledReadOnly
            className={inputBgClass}
            placeholder="-"
            value={lossValue}
          />
        </div>
      </div>

      <div className="pt-5 border-b border-lg" />
    </>
  );
};
