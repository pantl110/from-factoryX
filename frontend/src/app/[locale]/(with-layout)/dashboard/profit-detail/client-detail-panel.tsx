'use client';

import { useTranslations } from 'next-intl';
import { X } from '@phosphor-icons/react/dist/ssr';
import { ClientProfitModel } from '@/types/data-model';
import OverlayView from '@/ui/ovelay-view';
import IconBtn from '@/ui/icon-btn';
import { getRecentRange } from './utils';
import useProfitRange from './use-profit-range';
import ProductProfitTable from './product-profit-table';
import ProfitStatRow from './profit-stat-row';
import RangeSectionHeader from './range-section-header';
import MonthTrendSection from './month-trend-section';
import MonthDetailTableSection from './month-detail-table-section';

interface ClientDetailPanelProps {
  client: ClientProfitModel;
  initialFrom: string;
  initialTo: string;
  onClose: () => void;
}

const ClientDetailPanel = ({
  client,
  initialFrom,
  initialTo,
  onClose,
}: ClientDetailPanelProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const tCommon = useTranslations('common');

  const summary = useProfitRange({ from: initialFrom, to: initialTo });
  const trend = useProfitRange(getRecentRange(5));
  const monthDetail = useProfitRange();

  const findClient = (data: typeof summary.data) =>
    data?.by_client.find((c) => c.client_id === client.client_id) ?? null;

  const figures = findClient(summary.data) ?? client;
  const trendClient = findClient(trend.data);
  const trendMonthly = trendClient?.monthly ?? [];
  const trendLastYear = trendClient?.monthly_last_year ?? [];
  const monthDetailMonthly = findClient(monthDetail.data)?.monthly ?? [];

  return (
    <OverlayView onClose={onClose}>
      <div className="w-full flex flex-col gap-6 px-8 pb-8">
        <div className="sticky pt-8 top-0 z-10 bg-wh">
          <div className="flex justify-between items-center h-13 border-b border-lg">
            <div className="flex items-center gap-3">
              <h3 className="Heading-3">{client.client_name}</h3>
              {summary.isLoading && (
                <span className="Re_Body-2 text-sv">{tCommon('loading')}</span>
              )}
            </div>
            <IconBtn icon={X} onClick={onClose} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <RangeSectionHeader
            title={t('summaryTitle')}
            period={summary.period}
          />
          <ProfitStatRow
            revenue={figures.revenue}
            materialCost={figures.material_cost}
            profit={figures.profit}
            profitRate={figures.profit_rate}
          />
        </div>

        <ProductProfitTable
          rows={findClient(summary.data)?.products ?? client.products ?? []}
          searchable
          title={t('productDetailTitle')}
        />

        <MonthTrendSection
          rows={trendMonthly}
          lastYearRows={trendLastYear}
          isLoading={trend.isLoading}
          period={trend.period}
        />

        <MonthDetailTableSection
          rows={monthDetailMonthly}
          isLoading={monthDetail.isLoading}
          period={monthDetail.period}
        />
      </div>
    </OverlayView>
  );
};

export default ClientDetailPanel;
