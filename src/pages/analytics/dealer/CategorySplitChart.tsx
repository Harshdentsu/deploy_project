import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}

interface Props {
  dealerId: string;
}

const CategorySplitChart: React.FC<Props> = ({ dealerId }) => {
  const [data, setData] = useState<CategoryData[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8000/category-split?dealer_id=${dealerId}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [dealerId]);

  const labels = data.map(d => d.category);
  const values = data.map(d => d.count);
  const colors = [
    "#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
    "#14b8a6", "#ec4899", "#eab308"
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
            const percentage = data.find(d => d.category === label)?.percentage;
            return `${label}: ${count} SKUs (${percentage}%)`;
          },
        },
      },
      legend: { position: "right" as const },
    },
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <h2 className="text-base font-bold text-gray-600 dark:text-gray-200 mb-2 text-center">
        🗃️ Category Split
      </h2>
      <div className="w-full h-[200px] flex items-center justify-center">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default CategorySplitChart;
