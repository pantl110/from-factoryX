'use client';

import { useTranslations } from 'next-intl';
import { X } from '@phosphor-icons/react/dist/ssr';
import { ClientProfitModel } from '@/types/data-model';
import OverlayView from '@/ui/ovelay-view';
import IconBtn from '@/ui/icon-btn';
import NoHistoryBox from '@/ui/no-history-box';
import { formatMoney, formatRate } from './utils';
import ProductProfitTable from './product-profit-table';
import MonthProfitChart from './month-profit-chart';
import MonthProfitTable from './month-profit-table';

interface ClientDetailPanelProps {
  client: ClientProfitModel;
  onClose: () => void;
}

const Stat = ({
  label,
  value,
  valueColor = 'text-dg',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <div className="flex-1 pt-4 pb-3 px-4 rounded-lg border border-lg">
    <p className="Re_Body-1 text-sv">{label}</p>
    <p className={`mt-1 Heading-3 ${valueColor}`}>{value}</p>
  </div>
);

const ClientDetailPanel = ({ client, onClose }: ClientDetailPanelProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const won = t('won');

  return (
    <OverlayView onClose={onClose}>
      <div className="w-full flex flex-col gap-6 px-8 pb-8">
        <div className="sticky pt-8 top-0 z-10 bg-wh">
          <div className="flex justify-between items-center h-13 border-b border-lg">
            <h3 className="Heading-3">{client.client_name}</h3>
            <IconBtn icon={X} onClick={onClose} />
          </div>
        </div>

        <div className="flex gap-3">
          <Stat
            label={t('totalRevenue')}
            value={`${formatMoney(client.revenue)}${won}`}
          />
          <Stat
            label={t('materialCost')}
            value={`${formatMoney(client.material_cost)}${won}`}
            valueColor="text-sv"
          />
          <Stat
            label={t('totalProfit')}
            value={`${formatMoney(client.profit)}${won}`}
            valueColor="text-primary"
          />
          <Stat
            label={t('profitRate')}
            value={formatRate(client.profit_rate)}
            valueColor="text-primary"
          />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="Heading-3">{t('productDetailTitle')}</h3>
          {client.products && client.products.length > 0 ? (
            <ProductProfitTable rows={client.products} />
          ) : (
            <NoHistoryBox text={t('noProductData')} />
          )}
        </div>

        {client.monthly && client.monthly.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h3 className="Heading-3">{t('trendTitle')}</h3>
              <div className="border border-lg rounded-lg p-6 h-[280px]">
                <MonthProfitChart rows={client.monthly} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="Heading-3">{t('monthDetailTitle')}</h3>
              <MonthProfitTable rows={client.monthly} />
            </div>
          </div>
        )}
      </div>
    </OverlayView>
  );
};

export default ClientDetailPanel;
