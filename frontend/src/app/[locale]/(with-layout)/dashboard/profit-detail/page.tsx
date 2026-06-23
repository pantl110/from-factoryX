'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CaretLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from '@/i18n/navigation';
import {
  ClientProfitModel,
  ProfitDetailResponseModel,
} from '@/types/data-model';
import useGetProfitDetail from '@/hooks/dashboard/use-get-profit-detail';
import Spinner from '@/ui/spinner';
import SearchInput from '@/ui/search-input';
import NoHistoryBox from '@/ui/no-history-box';
import { normalizeForMatch } from '@/utils';
import { parseMonth } from './utils';
import ProfitSummaryCards from './profit-summary-cards';
import ClientProfitTable from './client-profit-table';
import ClientDetailPanel from './client-detail-panel';
import MonthProfitChart from './month-profit-chart';
import MonthProfitTable from './month-profit-table';

type ProfitTabType = 'client' | 'month';

const ProfitDetailPage = () => {
  const t = useTranslations('dashboard.profitDetail');
  const router = useRouter();
  const { getProfitDetail } = useGetProfitDetail();

  const [data, setData] = useState<ProfitDetailResponseModel | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tab, setTab] = useState<ProfitTabType>('month');
  const [selectedClient, setSelectedClient] =
    useState<ClientProfitModel | null>(null);
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    getProfitDetail().then((result) => {
      if (result.success && result.data) {
        setData(result.data);
      }
      setIsLoaded(true);
    });
  }, [getProfitDetail]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-10">
        <NoHistoryBox
          title={t('noData')}
          text={t('noDataDescription')}
          height="h-[60vh]"
        />
      </div>
    );
  }

  const start = parseMonth(data.period_start);
  const end = parseMonth(data.period_end);

  const tabs: { key: ProfitTabType; label: string }[] = [
    { key: 'month', label: t('tabMonth') },
    { key: 'client', label: t('tabClient') },
  ];

  const query = clientSearch.trim();
  const filteredClients = query
    ? data.by_client.filter((c) =>
        normalizeForMatch(c.client_name).includes(normalizeForMatch(query))
      )
    : data.by_client;

  return (
    <>
      <div className="pt-10 px-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 Re_Body-1 text-sv mb-3 cursor-pointer"
        >
          <CaretLeftIcon size={16} />
          {t('back')}
        </button>
        <h1 className="Heading-1">{t('title')}</h1>
        <p className="mt-2 Re_Body-1 text-sv">
          {t('monthLabel', { year: start.year, month: start.month })} ~{' '}
          {t('monthLabel', { year: end.year, month: end.month })} ·{' '}
          {t('subtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-8 p-10">
        <ProfitSummaryCards data={data} />

        <div className="flex gap-1 p-1 bg-bg rounded-lg w-fit">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`px-5 py-2 rounded-md Re_Body-1 cursor-pointer transition-colors ${
                tab === item.key
                  ? 'bg-wh text-primary shadow-[1px_1px_8px_rgba(0,0,0,0.08)]'
                  : 'text-sv'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'client' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="Heading-3">{t('tabClient')}</h3>
              <SearchInput
                width="w-[320px]"
                value={clientSearch}
                onChange={setClientSearch}
                placeholder={t('searchClientPlaceholder')}
              />
            </div>
            {filteredClients.length > 0 ? (
              <ClientProfitTable
                rows={filteredClients}
                onSelect={setSelectedClient}
              />
            ) : (
              <NoHistoryBox text={t('noClientResult')} />
            )}
          </div>
        )}

        {tab === 'month' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h3 className="Heading-3">{t('trendTitle')}</h3>
              <div className="border border-lg rounded-lg p-6 h-[320px] shadow-[2px_2px_22px_rgba(0,0,0,0.1)]">
                <MonthProfitChart rows={data.by_month} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="Heading-3">{t('monthDetailTitle')}</h3>
              <MonthProfitTable rows={data.by_month} />
            </div>
          </div>
        )}
      </div>

      {selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </>
  );
};

export default ProfitDetailPage;
