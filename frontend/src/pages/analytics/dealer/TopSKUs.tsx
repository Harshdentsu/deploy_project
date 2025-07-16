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
  dealerId: string;
  loading: boolean;
  height?: number;
  sortBy?: "quantity" | "revenue"; // optional: to support toggle
}

const TopSKUs: React.FC<TopSKUsProps> = ({
  dealerId,
  loading,
  height = 220,
  sortBy = "quantity",
}) => {
  const [skuData, setSkuData] = useState<any[]>([]);

  useEffect(() => {
    if (!dealerId) return;

    fetch(`http://localhost:8000/top-ordered-skus?dealer_id=${dealerId}&sort_by=${sortBy}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSkuData(data);
        } else if (data.top_skus) {
          setSkuData(data.top_skus);
        } else {
          setSkuData([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching top SKUs:", err);
        setSkuData([]);
      });
  }, [dealerId, sortBy]);

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading top SKUs…</div>;
  }

  if (!skuData || skuData.length === 0) {
    return <div className="text-gray-500 text-sm">No SKU data found.</div>;
  }

  const labels = skuData.map((sku) => sku.product_name);
  const values = sortBy === "revenue"
    ? skuData.map((sku) => sku.revenue)
    : skuData.map((sku) => sku.total_quantity);

  const data = {
    labels,
    datasets: [
      {
        label: sortBy === "revenue" ? "Revenue (₹)" : "Units Ordered",
        data: values,
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text:
          sortBy === "revenue"
            ? "Top SKUs by Revenue"
            : "Top  Ordered SKUs",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            sortBy === "revenue"
              ? `₹${context.raw}`
              : `${context.raw} units`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: sortBy === "revenue" ? "Revenue (₹)" : "Units Ordered",
        },
      },
      y: {
        title: { display: true, text: "Product" },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="w-full h-full relative" style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default TopSKUs;
