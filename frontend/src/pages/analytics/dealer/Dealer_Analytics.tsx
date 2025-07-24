import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Card from "./Card";
import { motion } from "framer-motion";
import { Import, ArrowRight } from "lucide-react";
import TotalOrdersCard from "./TotalOrdersCard";
import TotalUnitsCard from "./TotalUnitsCard";
import TotalPurchaseCard from "./TotalPurchaseCard";
import ClaimsRaisedCard from "./ClaimsRaisedCard";
import ClaimStatusPieChart from "./ClaimStatusPieChart";
import TopSKUs from "./TopSKUs";
import CategorySplitChart from "./CategorySplitChart";
import DealerZoneMap from "./DealerZoneMap";
export const Dealer_Analytics = () => {
  // Placeholder state for KPI and target, replace with dealer-specific fetch logic
  const [kpi, setKpi] = useState({ total_orders: 0, total_sales: 0, total_purchase: 0, claims_raised: 0 });
  const [target, setTarget] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const navigate = useNavigate();

  // Get dealerId from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const dealerId = user.dealer_id;
  const API_URL = import.meta.env.VITE_API_URL;

  // Example: fetch dealer-specific KPI and target here

  useEffect(() => {
    if (!dealerId) return;

    fetch(`${API_URL}/orders-count?dealer_id=${dealerId}`)
      .then(res => res.json())
      .then(data => {
        setKpi(prev => {
          const updated = { ...prev, total_orders: data.total_orders || 0 };
          console.log("Updated KPI:", updated);  // ✅ Log the KPI to debug
          return updated;
        });
      })
    fetch(`${API_URL}/total-units?dealer_id=${dealerId}`)
      .then(res => res.json())
      .then(data => {
        setTotalUnits(data.total_units || 0);
      })
    fetch(`${API_URL}/total-purchase?dealer_id=${dealerId}`)
      .then(res => res.json())
      .then(data => {
        setKpi(prev => ({ ...prev, total_purchase: data.total_purchase || 0 }));
      });
    fetch(`${API_URL}/dealer-claims-count?dealer_id=${dealerId}`)
      .then((res) => res.json())
      .then((data) => {
        setKpi(prev => ({ ...prev, claims_raised: data.claims_raised || 0 }));
      })
      .catch((err) => {
        console.error("Failed to fetch dealer claims count:", err);
      });
  }, []);


  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-indigo-50 via-white to-blue-100 dark:from-black dark:via-neutral-900 dark:to-black dark:text-slate-100 font-sans">
      <div className="w-full max-w-7xl mx-auto py-4 px-4">
        <div className="flex items-center justify-between mb-2">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
            className="text-2xl font-extrabold text-gray-700 dark:text-gray-200 tracking-tight"
          >
            📊  Dashboard
          </motion.h1>

          <div className="flex items-center">
            <Button onClick={() => navigate('/chat-assistant')} className="group flex items-center space-x-0">
              <span>Assistant</span>
              <ArrowRight className="h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4"
        >
          <TotalOrdersCard totalOrders={kpi.total_orders} />
          <TotalUnitsCard totalUnits={totalUnits} />
          <TotalPurchaseCard totalPurchase={kpi.total_purchase} />
          <ClaimsRaisedCard claimsCount={kpi.claims_raised} />


        </motion.div>

        {/* Add more dealer-specific analytics cards/charts below as needed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
        >
          <Card className="h-[260px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              <TopSKUs dealerId={dealerId} loading={false} sortBy="quantity" />
            </div>
          </Card>
          <Card className="h-[260px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">

            < div className="w-full h-full flex items-center justify-center">
              <ClaimStatusPieChart dealerId={dealerId} />
            </div>

          </Card>
          <Card className="h-[260px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              <CategorySplitChart dealerId={dealerId} />
            </div>
          </Card>
        </motion.div>

        {/* Dealer Zone Map full-width card */}
        <Card className="h-[340px] w-full flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300 mb-8">
          <div className="w-full h-full flex items-center justify-center">
            <DealerZoneMap dealerId={dealerId} />
          </div>
        </Card>
      </div>
    </div>
  );
}
