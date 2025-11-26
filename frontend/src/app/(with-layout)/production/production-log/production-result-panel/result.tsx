import { Input } from '@/ui';

interface ResultProps {
  unit: string;
  expectedUsage: number;
}

export const Result = ({ unit, expectedUsage }: ResultProps) => {
  return (
    <>
      <div className="mt-5 flex gap-2.5 bg-primary-8 rounded-[8px] p-4">
        <div className="flex-[0.6]">
          <Input
            label="이론 소요량"
            disabledReadOnly
            placeholder="-"
            className="bg-white"
            value={expectedUsage}
          />
        </div>
        <div className="flex-[0.4]">
          <Input
            label="단위"
            disabledReadOnly
            value={unit}
            className="bg-white"
          />
        </div>
        <div className="flex-[0.6]">
          <Input
            label="전체 투입량"
            disabledReadOnly
            placeholder="-"
            className="bg-white"
          />
        </div>
        <div className="flex-[0.4]">
          <Input
            label="단위"
            disabledReadOnly
            value={unit}
            className="bg-white"
          />
        </div>
        <div className="flex-1">
          <Input
            label="로스율(자동 계산)"
            message="(전체 투입량 - 이론 소요량) ÷ 실제 투입량"
            disabledReadOnly
            className="bg-white"
            placeholder="-"
          />
        </div>
      </div>

      <div className="pt-5 border-b border-lg" />
    </>
  );
};
