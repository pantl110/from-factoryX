import { CaretUpIcon, CaretDownIcon } from '@phosphor-icons/react/dist/ssr';
import { MonthlyProfitModel } from '@/types/data-model';

interface ProductionYieldProps {
  monthlyProfits: MonthlyProfitModel[];
}

const ProductionYield = ({ monthlyProfits }: ProductionYieldProps) => {
  if (!monthlyProfits || monthlyProfits.length < 2) return null;

  const isNegative = monthlyProfits[0].profit < monthlyProfits[1].profit;
  const changePercentage =
    monthlyProfits[0].profit !== undefined &&
    monthlyProfits[1].profit !== undefined
      ? ((monthlyProfits[0].profit - monthlyProfits[1].profit) /
          monthlyProfits[1].profit) *
        100
      : undefined;

  return (
    <div className="pt-5 pb-4 px-5 rounded-lg border border-[#eeeeee] h-[141px] shadow-[2px_2px_22px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-1">
        <p className="Heading-4 text-sv">생산 수익</p>
        <p className="flex gap-1 Heading-1">
          {(monthlyProfits[0].profit || 0).toLocaleString()} <span>만원</span>
        </p>

        {changePercentage !== undefined && !isNaN(changePercentage) && (
          <div className="flex flex-row justify-between">
            <div className="flex">
              <p className="Re_Body-1 text-sv mr-2">전월 대비</p>
              <div
                className={`Re_Body-1 flex ${
                  changePercentage === 0
                    ? 'text-dg'
                    : isNegative
                      ? 'text-red'
                      : 'text-primary'
                } items-center`}
              >
                <p>
                  {changePercentage === 0 ? '' : isNegative ? '-' : '+'}
                  {Math.abs(changePercentage)}
                  <span>%</span>
                </p>
                {changePercentage !== 0 && (
                  <div className="flex items-center justify-center w-4 h-4 ml-1">
                    {isNegative ? (
                      <CaretDownIcon size={16} weight="fill" />
                    ) : (
                      <CaretUpIcon size={16} weight="fill" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionYield;
