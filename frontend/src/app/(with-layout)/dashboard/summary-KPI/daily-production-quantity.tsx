import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react/dist/ssr';

interface DailyProductionQuantityProps {
  currentMonthProjects: number;
  previousMonthProjects: number;
}

const DailyProductionQuantity = ({
  currentMonthProjects,
  previousMonthProjects,
}: DailyProductionQuantityProps) => {
  const isNegative =
    currentMonthProjects &&
    previousMonthProjects &&
    currentMonthProjects < previousMonthProjects;

  const changePercentage =
    currentMonthProjects && previousMonthProjects
      ? ((currentMonthProjects - previousMonthProjects) /
          previousMonthProjects) *
        100
      : 0;

  return (
    currentMonthProjects !== undefined &&
    previousMonthProjects !== undefined && (
      <div className="pt-5 pb-4 px-5 rounded-lg border border-lg h-[141px] shadow-[2px_2px_22px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col gap-1">
          <p className="Heading-4 text-sv">진행 프로젝트 수</p>
          <p className="flex gap-1 Heading-1">
            {currentMonthProjects} <span>건</span>
          </p>

          {changePercentage !== undefined && previousMonthProjects !== 0 && (
            <div className="flex flex-row justify-between">
              <div className="flex">
                <p className="Re_Body-1 text-sv mr-2">전월 대비</p>
                <div
                  className={`flex ${
                    changePercentage === 0
                      ? 'text-dg'
                      : isNegative
                        ? 'text-red'
                        : 'text-primary'
                  } items-center Re_Body-1`}
                >
                  <p className="">
                    {changePercentage === 0 ? '' : isNegative ? '- ' : '+ '}
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
    )
  );
};

export default DailyProductionQuantity;
