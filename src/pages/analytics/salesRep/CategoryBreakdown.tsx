import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryBreakdown() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const salesRepId = user.sales_rep_id;

    fetch(`http://localhost:8000/category-sales-breakdown?sales_rep_id=${salesRepId}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const labels = data.map(item => item.category);
  const values = data.map(item => item.units_sold);
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
            const value = context.raw;
            const label = context.label;
            const percentage = data.find(d => d.category === label)?.percentage;
            return `${label}: ${value} units (${percentage}%)`;
          },
        },
      },
      legend: { position: "right" as const },
    },
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <h2 className="text-base font-bold text-gray-600 dark:text-gray-200 mb-2 text-center">
        Category-wise Sales Breakdown
      </h2>
      <div className="w-full h-[200px] flex items-center justify-center">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
