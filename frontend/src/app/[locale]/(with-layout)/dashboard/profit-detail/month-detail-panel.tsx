'use client';

import { useTranslations } from 'next-intl';
import { X } from '@phosphor-icons/react/dist/ssr';
import { MonthlyProfitDetailModel } from '@/types/data-model';
import OverlayView from '@/ui/ovelay-view';
import IconBtn from '@/ui/icon-btn';
import { parseMonth } from './utils';
import ClientProfitTable from './client-profit-table';
import ProductProfitTable from './product-profit-table';
import ProfitStatRow from './profit-stat-row';

interface MonthDetailPanelProps {
  month: MonthlyProfitDetailModel;
  onClose: () => void;
}

const MonthDetailPanel = ({ month, onClose }: MonthDetailPanelProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const { year, month: m } = parseMonth(month.month);

  return (
    <OverlayView onClose={onClose}>
      <div className="w-full flex flex-col gap-6 px-8 pb-8">
        <div className="sticky pt-8 top-0 z-10 bg-wh">
          <div className="flex justify-between items-center h-13 border-b border-lg">
            <h3 className="Heading-3">{t('monthLabel', { year, month: m })}</h3>
            <IconBtn icon={X} onClick={onClose} />
          </div>
        </div>

        <ProfitStatRow
          revenue={month.revenue}
          materialCost={month.material_cost}
          profit={month.profit}
          profitRate={month.profit_rate}
        />

        <ProductProfitTable
          scope="month_products"
          from={month.month}
          to={month.month}
          parentId={month.month}
          searchable
          title={t('productDetailTitle')}
        />

        <ClientProfitTable
          scope="month_clients"
          from={month.month}
          to={month.month}
          parentId={month.month}
          searchable
          title={t('tabClient')}
        />
      </div>
    </OverlayView>
  );
};

export default MonthDetailPanel;
