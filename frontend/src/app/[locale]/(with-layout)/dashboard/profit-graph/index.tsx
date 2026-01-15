'use client';

import { useTranslations } from 'next-intl';
import { MonthlyProfitModel } from '@/types/data-model';
import Chart from './chart';
import NoHistoryBox from '@/ui/no-history-box';
import useMemberStore from '@/store/member-store';

interface ProfitGraphProps {
  monthlyProfits: MonthlyProfitModel[];
  lastYearMonthlyProfits: MonthlyProfitModel[];
}

const ProfitGraph = ({
  monthlyProfits,
  lastYearMonthlyProfits,
}: ProfitGraphProps) => {
  const t = useTranslations('dashboard.profitGraph');
  const factoryId = useMemberStore((state) => state.factoryId);

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <h3 className="Heading-3">{t('title')}</h3>

      {factoryId && monthlyProfits && lastYearMonthlyProfits ? (
        <div className="border border-lg rounded-lg flex justify-center items-center px-10 py-5 shadow-[2px_2px_22px_rgba(0,0,0,0.1)] h-full min-h-[320px]">
          <div className="h-full w-full flex flex-col min-h-0">
            <div className="flex items-center gap-4 mb-2 mt-2 justify-end">
              <div className="flex items-center gap-2">
                <span className="inline-block w-8 h-4 bg-[#016fee]" />
                <span className="text-[#888] text-[16px] font-medium">
                  {t('thisYear')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-8 h-4 bg-[#E3E3E3]" />
                <span className="text-[#888] text-[16px] font-medium">
                  {t('lastYear')}
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-[240px]">
              <Chart
                monthlyProfits={monthlyProfits}
                lastYearMonthlyProfits={lastYearMonthlyProfits}
              />
            </div>
          </div>
        </div>
      ) : (
        <NoHistoryBox
          title={t('noData')}
          text={t('noDataDescription')}
          height="h-full"
        />
      )}
    </div>
  );
};

export default ProfitGraph;
