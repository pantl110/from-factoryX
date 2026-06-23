'use client';

import { useTranslations } from 'next-intl';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { MonthlyProfitDetailModel } from '@/types/data-model';
import { parseMonth } from './utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthProfitChartProps {
  rows: MonthlyProfitDetailModel[];
  lastYearRows?: MonthlyProfitDetailModel[];
}

const GREEN = '#02d677';
const GRAY = '#E3E3E3';

const bar = (label: string, data: number[], backgroundColor: string) => ({
  label,
  data,
  backgroundColor,
  barPercentage: 0.8,
  categoryPercentage: 0.5,
});

const OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  layout: { padding: { bottom: 16 } },
  scales: {
    x: { ticks: { color: '#949494', padding: 8, font: { size: 16 } } },
    y: { ticks: { color: '#949494', padding: 8, font: { size: 16 } } },
  },
};

const MonthProfitChart = ({ rows, lastYearRows }: MonthProfitChartProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const tGraph = useTranslations('dashboard.profitGraph');

  const chronological = [...rows].sort((a, b) =>
    a.month.localeCompare(b.month)
  );
  const labels = chronological.map((d) =>
    tGraph('month', { month: parseMonth(d.month).month })
  );

  const isYearOverYear = lastYearRows !== undefined;

  let datasets;
  let legend;
  if (isYearOverYear) {
    const lastYearByMonth: Record<number, number> = {};
    lastYearRows.forEach((r) => {
      lastYearByMonth[parseMonth(r.month).month] = r.profit;
    });
    datasets = [
      bar(
        tGraph('thisYear'),
        chronological.map((d) => d.profit),
        GREEN
      ),
      bar(
        tGraph('lastYear'),
        chronological.map(
          (d) => lastYearByMonth[parseMonth(d.month).month] ?? 0
        ),
        GRAY
      ),
    ];
    legend = [
      { color: GREEN, label: tGraph('thisYear') },
      { color: GRAY, label: tGraph('lastYear') },
    ];
  } else {
    datasets = [
      bar(
        t('legendRevenue'),
        chronological.map((d) => d.revenue),
        GRAY
      ),
      bar(
        t('legendProfit'),
        chronological.map((d) => d.profit),
        GREEN
      ),
    ];
    legend = [
      { color: GRAY, label: t('legendRevenue') },
      { color: GREEN, label: t('legendProfit') },
    ];
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-4 mb-2 justify-end Re_Body-1 text-sv">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="inline-block w-8 h-4"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        <Bar data={{ labels, datasets }} options={OPTIONS} />
      </div>
    </div>
  );
};

export default MonthProfitChart;
