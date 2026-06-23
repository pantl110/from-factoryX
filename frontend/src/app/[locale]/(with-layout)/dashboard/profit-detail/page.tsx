'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CaretLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from '@/i18n/navigation';
import {
  ClientProfitModel,
  MonthlyProfitDetailModel,
} from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import { getRecentRange } from './utils';
import useProfitRange from './use-profit-range';
import ProfitSummaryCards from './profit-summary-cards';
import ClientProfitTable from './client-profit-table';
import ClientDetailPanel from './client-detail-panel';
import MonthDetailPanel from './month-detail-panel';
import RangeSectionHeader from './range-section-header';
import MonthTrendSection from './month-trend-section';
import MonthDetailTableSection from './month-detail-table-section';
import SectionLoading from './section-loading';

type ProfitTabType = 'client' | 'month';

const ProfitDetailPage = () => {
  const t = useTranslations('dashboard.profitDetail');
  const router = useRouter();

  const summary = useProfitRange();
  const trend = useProfitRange(getRecentRange(5));
  const monthDetail = useProfitRange();

  const [tab, setTab] = useState<ProfitTabType>('month');
  const [selectedClient, setSelectedClient] =
    useState<ClientProfitModel | null>(null);
  const [selectedMonth, setSelectedMonth] =
    useState<MonthlyProfitDetailModel | null>(null);

  const tabs: { key: ProfitTabType; label: string }[] = [
    { key: 'month', label: t('tabMonth') },
    { key: 'client', label: t('tabClient') },
  ];

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
      </div>

      <div className="flex flex-col gap-8 p-10">
        {/* 전체 수익 요약 */}
        <div className="flex flex-col gap-3">
          <RangeSectionHeader
            title={t('summaryTitle')}
            period={summary.period}
          />
          {summary.isLoading ? (
            <SectionLoading height="h-[120px]" />
          ) : summary.data ? (
            <ProfitSummaryCards data={summary.data} />
          ) : (
            <NoHistoryBox
              title={t('noData')}
              text={t('noDataDescription')}
              height="h-[120px]"
            />
          )}
        </div>

        {/* 탭 */}
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

        {tab === 'month' && (
          <div className="flex flex-col gap-6">
            <MonthTrendSection
              rows={trend.data?.by_month ?? []}
              lastYearRows={trend.data?.by_month_last_year}
              isLoading={trend.isLoading}
              period={trend.period}
            />
            <MonthDetailTableSection
              rows={monthDetail.data?.by_month ?? []}
              isLoading={monthDetail.isLoading}
              period={monthDetail.period}
              onSelectMonth={setSelectedMonth}
            />
          </div>
        )}

        {tab === 'client' &&
          (summary.isLoading ? (
            <SectionLoading height="h-[200px]" />
          ) : (
            <ClientProfitTable
              rows={summary.data?.by_client ?? []}
              onSelect={setSelectedClient}
              searchable
              title={t('tabClient')}
            />
          ))}
      </div>

      {selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          initialFrom={summary.from}
          initialTo={summary.to}
          onClose={() => setSelectedClient(null)}
        />
      )}

      {selectedMonth && (
        <MonthDetailPanel
          month={selectedMonth}
          onClose={() => setSelectedMonth(null)}
        />
      )}
    </>
  );
};

export default ProfitDetailPage;
