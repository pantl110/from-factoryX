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
}

const MonthProfitChart = ({ rows }: MonthProfitChartProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const tGraph = useTranslations('dashboard.profitGraph');

  const chronological = [...rows].sort((a, b) =>
    a.month.localeCompare(b.month)
  );
  const labels = chronological.map((d) =>
    tGraph('month', { month: parseMonth(d.month).month })
  );

  const data = {
    labels,
    datasets: [
      {
        label: t('legendRevenue'),
        data: chronological.map((d) => d.revenue),
        backgroundColor: '#E3E3E3',
        barPercentage: 0.8,
        categoryPercentage: 0.5,
      },
      {
        label: t('legendProfit'),
        data: chronological.map((d) => d.profit),
        backgroundColor: '#02d677',
        barPercentage: 0.8,
        categoryPercentage: 0.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    layout: { padding: { bottom: 16 } },
    scales: {
      x: { ticks: { color: '#949494', padding: 8, font: { size: 16 } } },
      y: { ticks: { color: '#949494', padding: 8, font: { size: 16 } } },
    },
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-4 mb-2 justify-end Re_Body-1 text-sv">
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-4 bg-lg" />
          {t('legendRevenue')}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-4 bg-primary" />
          {t('legendProfit')}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default MonthProfitChart;
