import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

export default function Analytics() {
  const [salesData, setSalesData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/sales-reps")
      .then(res => res.json())
      .then(data => setSalesData(data))
      .catch(err => console.error(err));
  }, []);

  const chartData = {
    labels: salesData.map(rep => rep.name),
    datasets: [
      {
        label: "Target 🎯",
        data: salesData.map(rep => rep.monthly_sales_target),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
        fill: true,
        pointRadius: 5,
      },
      {
        label: "Achieved 📈",
        data: salesData.map(rep => rep.monthly_sales_achieved),
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        tension: 0.3,
        fill: true,
        pointRadius: 5,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: "Sales Rep Target vs Achievement (Line Graph)",
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Sales Amount" }
      },
      x: {
        title: { display: true, text: "Sales Reps" }
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Sales Performance</h2>
        <Button onClick={() => navigate("/assistant")}>
          ← Back to Assistant
        </Button>
      </div>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
