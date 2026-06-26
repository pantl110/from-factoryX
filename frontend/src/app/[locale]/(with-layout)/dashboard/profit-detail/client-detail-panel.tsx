'use client';

import { useTranslations } from 'next-intl';
import { X } from '@phosphor-icons/react/dist/ssr';
import { ClientProfitModel } from '@/types/data-model';
import OverlayView from '@/ui/ovelay-view';
import IconBtn from '@/ui/icon-btn';
import { getRecentRange } from './utils';
import usePeriodRange from './use-period-range';
import useProfitSummary from './use-profit-summary';
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
  const clientId = String(client.client_id);

  const summaryRange = usePeriodRange({ from: initialFrom, to: initialTo });
  const trendRange = usePeriodRange(getRecentRange(5));
  const monthRange = usePeriodRange();
  const summary = useProfitSummary({
    from: summaryRange.from,
    to: summaryRange.to,
    clientId,
  });

  const figures = summary.data ?? client;

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
            period={summaryRange.period}
          />
          <ProfitStatRow
            revenue={figures.revenue}
            materialCost={figures.material_cost}
            profit={figures.profit}
            profitRate={figures.profit_rate}
          />
        </div>

        <ProductProfitTable
          scope="client_products"
          from={summaryRange.from}
          to={summaryRange.to}
          parentId={clientId}
          searchable
          title={t('productDetailTitle')}
        />

        <MonthTrendSection period={trendRange.period} clientId={clientId} />

        <MonthDetailTableSection
          period={monthRange.period}
          scope="client_months"
          parentId={clientId}
        />
      </div>
    </OverlayView>
  );
};

export default ClientDetailPanel;
