import Chip from '@/ui/chip';

interface PreviewProps {
  standardUnit: string;
  conversionUnit: string;
  standardValue: number;
  conversionValue: number;
  decimalRule: string;
}

const Preview = ({
  standardUnit,
  conversionUnit,
  standardValue,
  conversionValue,
  decimalRule,
}: PreviewProps) => {
  // 소수점 규칙에 따른 반올림 함수
  const applyDecimalRule = (value: number, rule: string): number => {
    if (!value || isNaN(value)) return 0;

    switch (rule) {
      case '반올림':
        return Math.round(value);
      case '올림':
        return Math.ceil(value);
      case '내림':
        return Math.floor(value);
      default:
        return Math.round(value);
    }
  };

  // 계산된 값들 (비율 계산)
  // 왼쪽: 1 기준단위 = ? 변환단위 (변환값 ÷ 기준값)
  const leftRawValue =
    standardValue && conversionValue ? conversionValue / standardValue : 0;
  const leftResult = applyDecimalRule(leftRawValue, decimalRule);

  // 오른쪽: 1 변환단위 = ? 기준단위 (기준값 ÷ 변환값)
  const rightRawValue =
    standardValue && conversionValue ? standardValue / conversionValue : 0;
  const rightResult = applyDecimalRule(rightRawValue, decimalRule);

  return (
    <div className="p-5 flex flex-col gap-5 rounded-[8px] bg-bg">
      <div className="flex items-center justify-between w-full">
        <h4 className="Heading-4 text-primary">단위 계산 미리보기</h4>
        <span className="text-sv Me_Body-1">
          변환식을 모두 입력하면 자동 계산돼요.
        </span>
      </div>

      {/* 변환식 미리보기 */}
      {standardValue !== 0 &&
        conversionValue !== 0 &&
        standardUnit !== '' &&
        conversionUnit !== '' && (
          <div className="flex gap-2">
            <div className="flex-1 py-3 pl-4 pr-3 rounded-[8px] bg-wh border border-primary">
              <div className="flex items-center justify-between mb-2">
                <span className="Re_Body-2 text-sv">왼쪽 기준</span>
                <Chip
                  text="기준단위 → 변환단위"
                  bgColor="bg-primary-8"
                  textColor="text-primary"
                  size="small"
                />
              </div>
              <div className="flex gap-3 items-center mb-0.5">
                <div className="flex items-center gap-2">
                  <span className="Heading-3">1</span>
                  <span className="Me_Body-2 text-dg">{standardUnit}</span>
                </div>
                <span className="Me_Body-2 text-gr">=</span>
                <div className="flex items-center gap-2">
                  <span className="Heading-3">{leftResult}</span>
                  <span className="Me_Body-2 text-dg">{conversionUnit}</span>
                </div>
              </div>
              <span className="Re_Body-2 text-gr">
                ({decimalRule} 전 {leftRawValue.toFixed(4)} {conversionUnit})
              </span>
            </div>
            <div className="flex-1 py-3 pl-4 pr-3 rounded-[8px] bg-wh border border-primary">
              <div className="flex items-center justify-between mb-2">
                <span className="Re_Body-2 text-sv">오른쪽 기준</span>
                <Chip
                  text="변환단위 → 기준단위"
                  bgColor="bg-primary-8"
                  textColor="text-primary"
                  size="small"
                />
              </div>
              <div className="flex gap-3 items-center mb-0.5">
                <div className="flex items-center gap-2">
                  <span className="Heading-3">1</span>
                  <span className="Me_Body-2 text-dg">{conversionUnit}</span>
                </div>
                <span className="Me_Body-2 text-gr">=</span>
                <div className="flex items-center gap-2">
                  <span className="Heading-3">{rightResult}</span>
                  <span className="Me_Body-2 text-dg">{standardUnit}</span>
                </div>
              </div>
              <span className="Re_Body-2 text-gr">
                ({decimalRule} 전 {rightRawValue.toFixed(4)} {standardUnit})
              </span>
            </div>
          </div>
        )}
    </div>
  );
};

export default Preview;
