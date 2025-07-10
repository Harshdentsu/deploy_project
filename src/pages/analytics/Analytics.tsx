import React, { useState, useEffect } from "react";
import SalesTarget from "./SalesTarget";
import DealerPerformance from "./DealerPerformance";
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
  Filler,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation"; // 📌 install this

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  Filler,
  annotationPlugin // ✅ register annotation plugin
);

export default function Analytics() {
  const [repData, setRepData] = useState<any>({});
  const [view, setView] = useState<"sales" | "dealer">("sales");
  const navigate = useNavigate();
  const [dealerPerformance, setDealerPerformance] = useState<any[]>([]);
  const [loadingDealer, setLoadingDealer] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const salesrepid = user.sales_rep_id || localStorage.getItem("sales_rep_id");
    if (!salesrepid) return;

    fetch(`http://localhost:8000/sales-reps?salesrepid=${encodeURIComponent(salesrepid)}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setRepData(data[0]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (view !== "dealer") return;
    setLoadingDealer(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const sales_rep_id = user.sales_rep_id || localStorage.getItem("sales_rep_id");
    if (!sales_rep_id) return;
    fetch(`http://localhost:8000/dealer-performance?sales_rep_id=${encodeURIComponent(sales_rep_id)}`)
      .then(res => res.json())
      .then(data => {
        setDealerPerformance(data);
        setLoadingDealer(false);
      })
      .catch(err => {
        setLoadingDealer(false);
        setDealerPerformance([]);
      });
  }, [view]);

  const progress = repData.monthly_sales_achieved || 0;
  const target = repData.monthly_sales_target || 100000;

  const percentageAchieved = Math.min(100, Number(((progress / target) * 100).toFixed(1)));

  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const achievedSteps = [
    Math.floor(progress * 0.2),
    Math.floor(progress * 0.45),
    Math.floor(progress * 0.7),
    progress,
  ];

  const chartData = {
    labels: weeks,
    datasets: [
      {
        label: "Achieved 📈",
        data: achievedSteps,
        borderColor: "rgba(34, 197, 94, 1)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: (ctx: any) =>
          ctx.dataIndex === achievedSteps.length - 1 ? 8 : 4,
        pointBackgroundColor: (ctx: any) =>
          ctx.dataIndex === achievedSteps.length - 1
            ? "rgba(59, 130, 246, 1)" // Blue dot for "you are here"
            : "rgba(34, 197, 94, 1)",
      },
      {
        label: "Target 🎯",
        data: [target, target, target, target],
        borderColor: "red",
        borderDash: [8, 6],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: `Monthly Sales Progress (Stock-style View)`,
      },
      annotation: {
        annotations: {
          targetLine: {
            type: "line",
            yMin: target,
            yMax: target,
            borderColor: "red",
            borderDash: [8, 6],
            borderWidth: 2,
            label: {
              content: "🎯 Target",
              enabled: true,
              position: "end",
              backgroundColor: "red",
              color: "white",
            },
          },
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
        max: target + target * 0.1, // Only one tick above target
        title: { display: true, text: "Sales (₹)" },
        ticks: {
          callback: function (value: any) {
            return `₹${value.toLocaleString("en-IN")}`;
          },
        },
      },
      x: {
        title: { display: true, text: "Weeks" },
      },
    },
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Sales Rep Analytics</h2>
        <Button onClick={() => navigate("/assistant")} size="sm">
          ← Back
        </Button>
      </div>

      <div className="flex gap-2 mb-2">
        <Button
          variant={view === "sales" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("sales")}
        >
          Sales Target Progress
        </Button>
        <Button
          variant={view === "dealer" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("dealer")}
        >
          Dealer Performance
        </Button>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {view === "sales" && (
          <SalesTarget
            repData={repData}
            chartData={chartData}
            chartOptions={chartOptions}
            percentageAchieved={percentageAchieved}
          />
        )}
        {view === "dealer" && (
          <DealerPerformance
            dealerPerformance={dealerPerformance}
            loadingDealer={loadingDealer}
          />
        )}
      </div>
    </div>
  );
} 