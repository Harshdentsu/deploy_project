import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface TopSKUsProps {
  topSKUs: any[];
  loading: boolean;
}

const TopSKUs: React.FC<TopSKUsProps> = ({ topSKUs, loading }) => {
  const [skuData, setSkuData] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const salesRepId = user.sales_rep_id || localStorage.getItem("sales_rep_id");

    fetch(`http://localhost:8000/top-selling-skus?sales_rep_id=${salesRepId}`)
      .then(res => res.json())
      .then(setSkuData)
      .catch(console.error);
  }, []);

  const data = {
    labels: skuData.map((item: any) => item.product_name),
    datasets: [
      {
        label: "Units Sold",
        data: skuData.map((item: any) => item.total_quantity),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const contribution = skuData[context.dataIndex].contribution;
            return `${context.dataset.label}: ${context.raw} units (${contribution}%)`;
          },
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Product",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Units Sold",
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mt-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        🔹 Top Selling SKUs
      </h2>
      <Bar data={data} options={options} />
    </div>
  );
};

export default TopSKUs;
