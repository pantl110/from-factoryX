interface PreviewProps {
  addUnitType: 'material' | 'product';
  standardUnit: string;
  conversionUnit: string;
  standardValue: number;
  conversionValue: number;
}

const Preview = ({
  addUnitType,
  standardUnit,
  conversionUnit,
  standardValue,
  conversionValue,
}: PreviewProps) => {
  return (
    <div className="p-5 flex flex-col gap-2 rounded-[8px] bg-bg">
      <div className="flex items-center justify-between w-full">
        {/* <h4 className="Heading-4 text-primary">단위 계산 미리보기</h4> */}
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
            <div className="flex-1 py-3 pl-4 pr-3 rounded-[8px] bg-wh">
              <div className="flex items-center justify-between mb-2">
                <span className="Me_Body-3 text-primary">
                  {addUnitType === 'material'
                    ? `입고 시 1${standardUnit}은 몇 ${conversionUnit}(으)로 계산될까?`
                    : `납품 시 몇 ${standardUnit}는 1${conversionUnit}(으)로 계산될까?`}
                </span>
                <span className="Re_Body-2 text-sv">기준단위 → 변환단위</span>
              </div>
              <div className="flex gap-3 items-center mb-0.5">
                <div className="flex items-center gap-2">
                  <span className="Heading-3">
                    {addUnitType === 'material'
                      ? 1
                      : standardValue / conversionValue}
                  </span>
                  <span className="Me_Body-2 text-dg">{standardUnit}</span>
                </div>
                <span className="Me_Body-2 text-gr">=</span>
                <div className="flex items-center gap-2">
                  <span className="Heading-3">
                    {addUnitType === 'material'
                      ? conversionValue / standardValue
                      : 1}
                  </span>
                  <span className="Me_Body-2 text-dg">{conversionUnit}</span>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Preview;
