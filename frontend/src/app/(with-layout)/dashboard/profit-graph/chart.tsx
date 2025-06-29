"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { chartData } from "@/mocks/dashboard-graph-data";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const currentMonth = new Date().getMonth() + 1; // 현재 월
const endIdx = chartData.findIndex((d) => d.month === currentMonth) + 1; // 현재 월까지의 인덱스
const startIdx = Math.max(0, endIdx - 5); // 5개월 전까지의 인덱스
const recentData = chartData.slice(startIdx, endIdx); // 현재 월까지의 데이터

const months = recentData.map((d) => `${d.month}월`);
const thisYearData = recentData.map((d) => d.thisYear);
const lastYearData = recentData.map((d) => d.lastYear);

const data = {
  labels: months,
  datasets: [
    {
      label: "올해",
      data: thisYearData,
      backgroundColor: "#016fee",
      barPercentage: 0.8, // 막대 너비(0~1, 기본값 0.9)
      categoryPercentage: 0.5, // 카테고리 내 막대 비율(0~1, 기본값 0.8)
    },
    {
      label: "작년",
      data: lastYearData,
      backgroundColor: "#E3E3E3",
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
        color: "#949494",
        padding: 8,
        font: {
          size: 18,
        },
      },
    },
    y: {
      ticks: {
        color: "#949494",
        padding: 8,
        font: {
          size: 18,
        },
      },
    },
  },
};

const Chart = () => {
  return <Bar data={data} options={options} />;
};

export default Chart;
