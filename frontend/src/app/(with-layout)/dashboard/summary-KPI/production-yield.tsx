import { CaretUpIcon, CaretDownIcon } from '@phosphor-icons/react/dist/ssr';
import { ProductionProfitRateModel } from '@/app/(with-layout)/dashboard/type';

interface ProductionYieldProps {
  data?: ProductionProfitRateModel;
}

const ProductionYield = ({ data }: ProductionYieldProps) => {
  if (!data) return null;

  const isNegative = data.change_percentage && data.change_percentage < 0;

  return (
    <div className="pt-5 pb-4 px-5 rounded-lg border border-[#eeeeee] h-[141px] shadow-[2px_2px_22px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-1">
        <p className="Heading-4 text-sv">생산 수익률</p>
        <p className="flex gap-1 Heading-1">
          {data.current_month_profit || 0} <span>만원</span>
        </p>

        {data.change_percentage && (
          <div className="flex flex-row justify-between">
            <div className="flex">
              <p className="Re_Body-1 text-sv mr-2">전월 대비</p>
              <div
                className={`Re_Body-1 flex ${isNegative ? 'text-red' : 'text-primary'} items-center`}
              >
                <p>
                  {data.change_percentage}
                  <span>%</span>
                </p>
                <div className="flex items-center justify-center w-4 h-4 ml-1">
                  {isNegative ? (
                    <CaretDownIcon size={16} weight="fill" />
                  ) : (
                    <CaretUpIcon size={16} weight="fill" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionYield;
