import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ClaimStatus {
  status: string;
  count: number;
  percentage: number;
}

interface Props {
  dealerId: string;
}

const ClaimStatusPieChart: React.FC<Props> = ({ dealerId }) => {
  const [data, setData] = useState<ClaimStatus[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8000/claim-status-distribution?dealer_id=${dealerId}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [dealerId]);

  const labels = data.map((item) => item.status);
  const values = data.map((item) => item.count);

  const colors = [
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#10b981", // green
    "#ef4444", // red
    "#8b5cf6", // violet
    "#14b8a6", // teal
    "#ec4899", // pink
    "#eab308", // yellow
  ];

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label;
            const count = context.raw;
            const percentage = data.find((d) => d.status === label)?.percentage;
            return `${label}: ${count} (${percentage}%)`;
          },
        },
      },
      legend: {
        position: "right" as const,
        labels: {
          color: "#6b7280", // text-gray-500
        },
      },
    },
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <h2 className="text-base font-bold text-gray-600 dark:text-gray-200 mb-2 text-center">
        Claim Status Distribution
      </h2>
      <div className="w-full h-[200px] flex items-center justify-center">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ClaimStatusPieChart;
