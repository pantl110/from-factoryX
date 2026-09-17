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

  // 대체 자재는 기준 자재와 단위가 다를 수 있어 실제 투입량 합계와
  // 로스율은 표시하지 않지만, BOM 기준의 이론 소요량과 단위는 유지한다.
  const isActualUsageDisabled = hasSubstitute;
  const totalValue = isActualUsageDisabled ? '-' : totalUsage;
  const actualUsageUnitValue = isActualUsageDisabled ? '-' : unit;
  const lossValue = isActualUsageDisabled ? '-' : lossRateDisplay;
  const actualUsageBgClass = isActualUsageDisabled ? 'bg-lg' : 'bg-white';

  return (
    <>
      <div className="mt-5 flex gap-2.5 bg-green-8 rounded-[8px] p-4">
        <div className="flex-[0.6]">
          <Input
            label={t('theoreticalUsage')}
            disabledReadOnly
            placeholder="-"
            className="bg-white"
            value={expectedUsage}
          />
        </div>
        <div className="flex-[0.4]">
          <Input
            label={tCommon('unit')}
            disabledReadOnly
            value={unit}
            className="bg-white truncate"
          />
        </div>
        <div className="flex-[0.6]">
          <Input
            label={t('totalInput')}
            disabledReadOnly
            placeholder="-"
            className={actualUsageBgClass}
            value={totalValue}
          />
        </div>
        <div className="flex-[0.4]">
          <Input
            label={tCommon('unit')}
            disabledReadOnly
            value={actualUsageUnitValue}
            className={`${actualUsageBgClass} truncate`}
          />
        </div>
        <div className="flex-1">
          <Input
            label={t('lossRate')}
            message={t('lossRateMessage')}
            disabledReadOnly
            className={actualUsageBgClass}
            placeholder="-"
            value={lossValue}
          />
        </div>
      </div>

      <div className="pt-5 border-b border-lg" />
    </>
  );
};
