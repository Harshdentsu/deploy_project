import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"; // update this if you use another button component

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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
        backgroundColor: "rgba(54, 162, 235, 0.7)"
      },
      {
        label: "Achieved 📈",
        data: salesData.map(rep => rep.monthly_sales_achieved),
        backgroundColor: "rgba(255, 159, 64, 0.7)"
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Sales Rep Target vs Achieved" }
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Sales Performance</h2>
        <Button onClick={() => navigate("/assistant")}>← Back to Assistant</Button>
      </div>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}
