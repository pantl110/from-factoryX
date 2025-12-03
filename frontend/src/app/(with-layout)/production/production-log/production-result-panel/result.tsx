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
            label="이론 소요량"
            disabledReadOnly
            placeholder="-"
            className={inputBgClass}
            value={theoryValue}
          />
        </div>
        <div className="flex-[0.4]">
          <Input
            label="단위"
            disabledReadOnly
            value={unitValue}
            className={`${inputBgClass} truncate`}
          />
        </div>
        <div className="flex-[0.6]">
          <Input
            label="전체 투입량"
            disabledReadOnly
            placeholder="-"
            className={inputBgClass}
            value={totalValue}
          />
        </div>
        <div className="flex-[0.4]">
          <Input
            label="단위"
            disabledReadOnly
            value={unitValue}
            className={`${inputBgClass} truncate`}
          />
        </div>
        <div className="flex-1">
          <Input
            label="로스율(자동 계산)"
            message="(전체 투입량 - 이론 소요량) ÷ 실제 투입량"
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
