// E:\Projects\Python\hr-kuber\src\components\LeavePieChart.jsx

import ReactApexChart from 'react-apexcharts';

export default function LeavePieChart({ data }) {
  const chartOptions = {
    labels: ['Approved', 'Pending', 'Rejected'],
    colors: ['#34d399', '#fbbf24', '#f87171'],
    legend: {
      position: 'bottom',
      labels: {
        colors: ['#4B5563'], // Tailwind gray-700
      },
    },
    chart: {
      background: 'transparent',
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          legend: { position: 'bottom' },
        },
      },
    ],
  };

  const chartSeries = [
    data?.approved ?? 0,
    data?.pending ?? 0,
    data?.rejected ?? 0,
  ];

  const isEmpty = chartSeries.every(val => val === 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Leave Distribution
      </h2>
      {isEmpty ? (
        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
          No leave data available
        </div>
      ) : (
        <ReactApexChart
          options={chartOptions}
          series={chartSeries}
          type="pie"
          height={300}
        />
      )}
    </div>
  );
}