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

interface DealerPerformanceProps {
  dealerPerformance: any[];
  loadingDealer: boolean;
}

export default function DealerPerformanceChart({ dealerPerformance, loadingDealer }: DealerPerformanceProps) {
  if (loadingDealer) {
    return <div className="py-8 text-center text-gray-500">Loading dealer performance...</div>;
  }

  if (dealerPerformance.length === 0) {
    return <div className="py-8 text-center text-gray-500">No dealer data found.</div>;
  }

  const labels = dealerPerformance.map((dealer) => dealer.dealer_name);
  const data = dealerPerformance.map((dealer) => dealer.total_sales);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Total Sales (₹)",
        data,
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Dealer Sales Performance",
        font: {
          size: 18,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.raw;
            return `₹${value.toLocaleString("en-IN")}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Sales (₹)" },
        ticks: {
          callback: function (value: any) {
            return `₹${value.toLocaleString("en-IN")}`;
          },
        },
      },
      x: {
        title: { display: true, text: "Dealer" },
      },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}
