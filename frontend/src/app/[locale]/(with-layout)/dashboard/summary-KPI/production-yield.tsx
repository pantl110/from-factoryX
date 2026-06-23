'use client';

import { useTranslations } from 'next-intl';
import {
  CaretUpIcon,
  CaretDownIcon,
  CaretRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { MonthlyProfitModel } from '@/types/data-model';
import { removeTrailingZeros } from '@/utils';
import { useRouter } from '@/i18n/navigation';

interface ProductionYieldProps {
  monthlyProfits: MonthlyProfitModel[];
}

const ProductionYield = ({ monthlyProfits }: ProductionYieldProps) => {
  const t = useTranslations('dashboard.summaryKPI');
  const router = useRouter();

  // 데이터가 없거나 빈 배열인 경우 기본값 사용
  const currentProfit =
    monthlyProfits && monthlyProfits.length > 0
      ? monthlyProfits[0].profit || 0
      : 0;
  const previousProfit =
    monthlyProfits && monthlyProfits.length > 1
      ? monthlyProfits[1].profit
      : undefined;

  const isNegative =
    previousProfit !== undefined ? currentProfit < previousProfit : false;
  const changePercentage =
    previousProfit !== undefined && previousProfit !== 0
      ? ((currentProfit - previousProfit) / previousProfit) * 100
      : undefined;

  // 소수점이 0이면 제거 (유틸 함수 사용, 콤마 제거)
  const formatProfit = (profit: number): string => {
    return removeTrailingZeros(profit.toFixed(2)).replace(/,/g, '');
  };

  return (
    <div className="pt-5 pb-4 px-5 rounded-lg border border-lg flex-1 shadow-[2px_2px_22px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="Heading-4 text-sv">{t('productionRevenue')}</p>
          <button
            onClick={() => router.push('/dashboard/profit-detail')}
            className="flex items-center gap-0.5 Re_Body-1 text-primary cursor-pointer"
          >
            {t('viewDetail')}
            <CaretRightIcon size={14} />
          </button>
        </div>
        <p className="flex gap-1 Heading-1">
          {formatProfit(currentProfit)} <span>{t('tenThousandWon')}</span>
        </p>

        {changePercentage !== undefined && !isNaN(changePercentage) && (
          <div className="flex flex-row justify-between">
            <div className="flex">
              <p className="Re_Body-1 text-sv mr-2">
                {t('comparedToLastMonth')}
              </p>
              <div
                className={`Re_Body-1 flex ${
                  changePercentage === 0
                    ? 'text-dg'
                    : isNegative
                      ? 'text-red'
                      : 'text-blue'
                } items-center`}
              >
                <p>
                  {changePercentage === 0 ? '' : isNegative ? '-' : '+'}
                  {Math.abs(changePercentage).toFixed(2)}
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
