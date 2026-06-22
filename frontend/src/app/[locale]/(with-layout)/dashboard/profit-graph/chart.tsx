'use client';

import { useTranslations, useLocale } from 'next-intl';
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
import { MonthlyProfitModel } from '@/types/data-model';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartProps {
  monthlyProfits: MonthlyProfitModel[];
  lastYearMonthlyProfits: MonthlyProfitModel[];
}

const Chart = ({ monthlyProfits, lastYearMonthlyProfits }: ChartProps) => {
  const t = useTranslations('dashboard.profitGraph');
  const locale = useLocale();

  if (!monthlyProfits || !lastYearMonthlyProfits) return null;

  // 데이터를 최신순으로 정렬 (API 응답이 최신순이므로 그대로 사용)
  const months = monthlyProfits
    .map((d) => {
      const monthNum = parseInt(d.month.split('-')[1]);
      if (locale === 'en') {
        // 영어: 월 이름 축약형 사용
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        return monthNames[monthNum - 1];
      }
      return t('month', { month: monthNum });
    })
    .reverse();
  const thisYearData = monthlyProfits.map((d) => d.profit).reverse();
  const lastYearData = lastYearMonthlyProfits.map((d) => d.profit).reverse();

  const data = {
    labels: months,
    datasets: [
      {
        label: t('thisYear'),
        data: thisYearData,
        backgroundColor: '#02d677',
        barPercentage: 0.8, // 막대 너비(0~1, 기본값 0.9)
        categoryPercentage: 0.5, // 카테고리 내 막대 비율(0~1, 기본값 0.8)
      },
      {
        label: t('lastYear'),
        data: lastYearData,
        backgroundColor: '#E3E3E3',
        barPercentage: 0.8,
        categoryPercentage: 0.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    layout: {
      padding: {
        bottom: 32,
      },
    },

    scales: {
      x: {
        ticks: {
          color: '#949494',
          padding: 8,
          font: {
            size: 18,
          },
        },
      },
      y: {
        ticks: {
          color: '#949494',
          padding: 8,
          font: {
            size: 18,
          },
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default Chart;
