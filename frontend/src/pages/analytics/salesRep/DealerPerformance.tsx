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
  height?: number;
}

export default function DealerPerformanceChart({
  dealerPerformance,
  loadingDealer,
  height = 180,
}: DealerPerformanceProps) {
  if (loadingDealer) {
    return <div className="py-8 text-center text-gray-500">Loading dealer performance...</div>;
  }

  if (dealerPerformance.length === 0) {
    return <div className="py-8 text-center text-gray-500">No dealer data found.</div>;
  }

  const sortedDealers = [...dealerPerformance].sort((a, b) => b.total_sales - a.total_sales);
  const labels = sortedDealers.map((d) => d.dealer_name.split(" ")[0]);
  const data = sortedDealers.map((d) => d.total_sales);
  const totalSalesSum = data.reduce((acc, val) => acc + val, 0);

  const backgroundColors = data.map((_, i) =>
    i === 0 ? "rgba(34,197,94,0.7)" : (i === data.length - 1 ? "rgba(239,68,68,0.7)" : "rgba(59,130,246,0.6)")
  );
  const borderColors = data.map((_, i) =>
    i === 0 ? "rgba(34,197,94,1)" : (i === data.length - 1 ? "rgba(239,68,68,1)" : "rgba(59,130,246,1)")
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Total Sales (₹)",
        data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const percent = ((value / totalSalesSum) * 100).toFixed(1);
            return `₹${value.toLocaleString("en-IN")} (${percent}%)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Sales (₹)", font: { weight: "bold" } },
        ticks: {
          callback: (value: any) => `₹${value.toLocaleString("en-IN")}`,
        },
      },
      x: {
        title: { display: true, text: "Dealer", font: { weight: "bold" } },
      },
    },
  };

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-base font-bold text-gray-600 dark:text-gray-200 mb-2 text-center">
        Dealer sales performance
      </h2>
      <div className="flex-grow relative" style={{ height: height }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
