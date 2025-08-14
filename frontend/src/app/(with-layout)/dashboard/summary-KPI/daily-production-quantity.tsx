import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react/dist/ssr';
import { DailyProductionQuantityModel } from '../type';

interface DailyProductionQuantityProps {
  data?: DailyProductionQuantityModel;
}

const DailyProductionQuantity = ({ data }: DailyProductionQuantityProps) => {
  if (!data) return null;

  const isNegative = data.change_percentage && data.change_percentage < 0;

  return (
    data && (
      <div className="pt-5 pb-4 px-5 rounded-lg border border-lg h-[141px] shadow-[2px_2px_22px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col gap-1">
          <p className="Heading-4 text-sv">오늘 생산량</p>
          <p className="flex gap-1 Heading-1">
            {data.production_count} <span>건</span>
          </p>

          {data.change_percentage && (
            <div className="flex flex-row justify-between">
              <div className="flex">
                <p className="Re_Body-1 text-sv mr-2">전월 대비</p>
                <div
                  className={`flex ${
                    isNegative ? 'text-red' : 'text-primary'
                  } items-center Re_Body-1`}
                >
                  <p className="">
                    {/* {isPositive ? '+' : '-'} */}
                    {data.change_percentage ? data.change_percentage : 0}
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
    )
  );
};

export default DailyProductionQuantity;
