import { MonthlyProfitModel } from '@/types/data-model';
import Chart from './chart';
import NoHistoryBox from '@/ui/no-history-box';

interface ProfitGraphProps {
  monthlyProfits: MonthlyProfitModel[];
  lastYearMonthlyProfits: MonthlyProfitModel[];
}

const ProfitGraph = ({
  monthlyProfits,
  lastYearMonthlyProfits,
}: ProfitGraphProps) => {
  return (
    <div className="flex flex-col flex-1 gap-3 min-w-[652px]">
      <h3 className="Heading-3">생산 이익 그래프</h3>

      {monthlyProfits && lastYearMonthlyProfits ? (
        <div className="border border-lg rounded-lg flex justify-center items-center px-10 py-5 shadow-[2px_2px_22px_rgba(0,0,0,0.1)] h-[447px]">
          <div className="h-full w-full">
            <div className="flex items-center gap-4 mb-2 mt-2 justify-end">
              <div className="flex items-center gap-2">
                <span className="inline-block w-8 h-4 bg-[#016fee]" />
                <span className="text-[#888] text-[16px] font-medium">
                  올해
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-8 h-4 bg-[#E3E3E3]" />
                <span className="text-[#888] text-[16px] font-medium">
                  작년
                </span>
              </div>
            </div>
            <Chart
              monthlyProfits={monthlyProfits}
              lastYearMonthlyProfits={lastYearMonthlyProfits}
            />
          </div>
        </div>
      ) : (
        <NoHistoryBox
          title="생산 이익 데이터가 없어요."
          text="제품을 생산하고 판매하면, 그에 따른 실적 정보가 자동으로 정리돼요."
        />
      )}
    </div>
  );
};

export default ProfitGraph;
