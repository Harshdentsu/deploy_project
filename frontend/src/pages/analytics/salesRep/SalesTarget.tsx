import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  Title,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title
);

interface SalesTargetProps {
  percentageAchieved: number;
  achieved: number;
  target: number;
  height?: number;
}

const SalesTarget: React.FC<SalesTargetProps> = ({
  percentageAchieved,
  achieved,
  target,
  height = 200,
}) => {
  const cappedPercentage = Math.min(100, percentageAchieved);
  const numWeeks = 4;

  // Generate weekly achieved sales values
  const weeklySales = Array(numWeeks)
    .fill(0)
    .map((_, i) => Math.round((achieved / numWeeks) * (i + 1)));

  const targetPerWeek = Math.round(target / numWeeks);

  const data: ChartData<"line"> = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Achieved",
        data: weeklySales,
        borderColor: "#10B981",
        backgroundColor: "#D1FAE5",
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
      {
        label: "Target",
        data: Array(numWeeks).fill(targetPerWeek),
        borderColor: "#9CA3AF",
        borderDash: [6, 6],
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `₹${(ctx.raw as number).toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: "#6B7280" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#F3F4F6" },
        ticks: {
          callback: (val) => `₹${val}`,
          stepSize: target / 4,
        },
      },
    },
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-2">
      <h2 className="text-base font-bold text-gray-600 dark:text-gray-200 text-center mb-1">
        Sales Target Progress
      </h2>

      <div className="w-full" style={{ height }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default SalesTarget;
