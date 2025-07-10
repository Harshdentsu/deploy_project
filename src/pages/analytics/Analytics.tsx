import React, { useState, useEffect } from "react";
import SalesTarget from "./SalesTarget";
import DealerPerformance from "./DealerPerformance";
import TopSKUs from "./TopSKUs";

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
import annotationPlugin from "chartjs-plugin-annotation";

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
  annotationPlugin
);

export default function Analytics() {
  const [repData, setRepData] = useState<any>({});
  const [dealerPerformance, setDealerPerformance] = useState<any[]>([]);
  const [loadingDealer, setLoadingDealer] = useState(false);
  const navigate = useNavigate();
  const [topSKUs, setTopSKUs] = useState<any[]>([]);
  const [loadingSKUs, setLoadingSKUs] = useState(false);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const salesrepid = user.sales_rep_id || localStorage.getItem("sales_rep_id");
    if (!salesrepid) return;

    fetch(`http://localhost:8000/sales-reps?salesrepid=${encodeURIComponent(salesrepid)}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) setRepData(data[0]);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const sales_rep_id = user.sales_rep_id || localStorage.getItem("sales_rep_id");
    if (!sales_rep_id) return;

    setLoadingDealer(true);
    fetch(`http://localhost:8000/dealer-performance?sales_rep_id=${encodeURIComponent(sales_rep_id)}`)
      .then(res => res.json())
      .then(data => {
        setDealerPerformance(data);
        setLoadingDealer(false);
      })
      .catch(() => {
        setDealerPerformance([]);
        setLoadingDealer(false);
      });
  }, []);

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
        pointRadius: (ctx: any) => ctx.dataIndex === achievedSteps.length - 1 ? 8 : 4,
        pointBackgroundColor: (ctx: any) =>
          ctx.dataIndex === achievedSteps.length - 1
            ? "rgba(59, 130, 246, 1)"
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
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: { position: 'top' },
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
        max: target + target * 0.1,
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
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Sales Rep Analytics</h1>
        <Button onClick={() => navigate("/assistant")} size="sm">
          ← Back
        </Button>
      </div>

      {/* 🔹 Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">🎯 Target Achieved</p>
          <h2 className="text-3xl font-bold text-green-600">{percentageAchieved}%</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">📌 Monthly Target</p>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">₹{target.toLocaleString("en-IN")}</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">✅ Achieved</p>
          <h2 className="text-3xl font-bold text-blue-600">₹{progress.toLocaleString("en-IN")}</h2>
        </div>
      </div>

      {/* 🔹 Chart Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            📊 Sales Target Progress
          </h2>
          <SalesTarget
            repData={repData}
            chartData={chartData}
            chartOptions={chartOptions}
            percentageAchieved={percentageAchieved}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            🏆 Dealer Performance
          </h2>
          <DealerPerformance
            dealerPerformance={dealerPerformance}
            loadingDealer={loadingDealer}
          />
        </div>
      </div>

      {/* 🔹 Top Selling SKUs */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          🛒 Top Selling SKUs
        </h2>
        <TopSKUs topSKUs={topSKUs} loading={loadingSKUs} />
      </div>
    </div>
  );
}
