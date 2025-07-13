import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

interface TopSKUsProps {
  topSKUs: any[];
  loading: boolean;
  height?: number;
}

const TopSKUs: React.FC<TopSKUsProps> = ({ topSKUs, loading, height = 220 }) => {
  const [skuData, setSkuData] = useState<any[]>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const salesRepId = user.sales_rep_id || localStorage.getItem("sales_rep_id");

    fetch(`http://localhost:8000/top-selling-skus?sales_rep_id=${salesRepId}`)
      .then((res) => res.json())
      .then((data) => setSkuData(data || []))
      .catch((err) => {
        console.error("Error fetching top SKUs:", err);
        setSkuData([]);
      });
  }, []);

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading top SKUs…</div>;
  }

  if (skuData.length === 0) {
    return <div className="text-gray-500 text-sm">No SKU data found.</div>;
  }

  const labels = skuData.map((sku) => sku.product_name);
  const quantities = skuData.map((sku) => sku.total_quantity);

  const data = {
    labels,
    datasets: [
      {
        label: "Units Sold",
        data: quantities,
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    indexAxis: "y" as const, // Horizontal bars
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: " Top 5 Selling SKUs",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.raw} units`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: { display: true, text: "Units Sold" },
      },
      y: {
        title: { display: true, text: "SKU" },
      },
    },
  };

  return (
    <div className="w-full h-full relative">
      <Bar data={data} options={{ ...options, maintainAspectRatio: false }} />
    </div>
  );
  
};

export default TopSKUs;
