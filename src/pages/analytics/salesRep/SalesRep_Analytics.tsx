import React, { useState, useEffect } from "react";
import SalesTarget from "./SalesTarget";
import DealerPerformance from "./DealerPerformance";
import TopSKUs from "./TopSKUs";
import CountUp from "react-countup";
import CategoryBreakdown from "./CategoryBreakdown";
import ZoneMap from "./ZoneMap";
import TopSellingSKUCard from "./TopSellingSKUCard";
import MonthlyTargetCard from "./MonthlyTargetCard";
import TotalOrdersCard from "./TotalOrdersCard";
import TotalSalesCard from "./TotalSalesCard";
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
import Card from "./Card";
import { motion } from "framer-motion";
import { Package, DollarSign, Target, TrendingUp } from "lucide-react";

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

export default function SalesRep_Analytics() {
  const [repData, setRepData] = useState<any>({});
  const [dealerPerformance, setDealerPerformance] = useState<any[]>([]);
  const [loadingDealer, setLoadingDealer] = useState(false);
  const navigate = useNavigate();
  const [topSKUs, setTopSKUs] = useState<any[]>([]);
  const [loadingSKUs, setLoadingSKUs] = useState(false);
  const [kpi, setKpi] = useState({ total_orders: 0, total_sales: 0 });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const sales_rep_id = user.sales_rep_id || localStorage.getItem("sales_rep_id");
    if (!sales_rep_id) return;

    fetch(`http://localhost:8000/kpi-metrics?sales_rep_id=${sales_rep_id}`)
      .then(res => res.json())
      .then(setKpi)
      .catch(err => console.error("Error fetching KPI metrics", err));
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const salesrepid = user.sales_rep_id || localStorage.getItem("sales_rep_id");
    if (!salesrepid) return;

    fetch(`http://localhost:8000/monthly-target?salesrepid=${encodeURIComponent(salesrepid)}`)
      .then(res => res.json())
      .then(data => {
        setRepData(data);
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

  const progress = repData.achieved || 0;
  const target = repData.target || 100000;
  const percentageAchieved = repData.percentageAchieved || 0;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;

  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-indigo-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans">
      <div className="w-full max-w-7xl mx-auto py-4 px-4">
        <div className="flex items-center justify-between mb-2">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
            className="text-2xl font-extrabold text-gray-700 dark:text-gray-200 tracking-tight"
          >
            📊 Dashboard
          </motion.h1>
          <Button onClick={() => navigate('/chat-assistant')}> Back</Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4"
        >
          
          
        <TotalOrdersCard totalOrders={kpi.total_orders} />
        <TotalSalesCard totalSales={kpi.total_sales} />
        <MonthlyTargetCard target={target} />
        <TopSellingSKUCard />
          
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
        >
          <Card className="h-[260px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              <SalesTarget percentageAchieved={percentageAchieved} achieved={progress} target={target} />
            </div>
          </Card>
          <Card className="h-[260px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              <DealerPerformance dealerPerformance={dealerPerformance} loadingDealer={loadingDealer} />
            </div>
          </Card>
          <Card className="h-[260px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              <CategoryBreakdown />
            </div>
          </Card>
         
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 mb-0"
        >
           <Card className="h-[260px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              <TopSKUs topSKUs={topSKUs} loading={loadingSKUs} />
            </div>
          </Card>
          
          <Card className="h-[260px] bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl hover:shadow-xl transition-shadow border-t-4 border-gray-300 p-0">
          <div className="w-full h-full flex flex-col">
            <h2 className="text-base font-bold text-gray-600 dark:text-gray-200 mb-2 text-center">
              Regional Sales Overview
            </h2>
            <div className="flex-grow overflow-hidden rounded-xl">
              <ZoneMap darkMap={false} />
            </div>
          </div>
        </Card>


        </motion.div>
      </div>
    </div>
  );
}
