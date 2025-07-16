import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Card from "../salesRep/Card";
import { motion } from "framer-motion";

// TODO: Import admin-specific analytics components here

export default function Admin_Analytics() {
  // TODO: Replace with admin-specific state and fetch logic
  const [kpi, setKpi] = useState({ total_users: 0, total_sales: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: Fetch admin-specific KPI metrics here
  }, []);

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
          {/* TODO: Add admin KPI cards here */}
          <Card className="h-[120px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500">Total Users: {kpi.total_users}</span>
            </div>
          </Card>
          <Card className="h-[120px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500">Total Sales: {kpi.total_sales}</span>
            </div>
          </Card>
        </motion.div>

        {/* TODO: Add more admin analytics cards/charts below as needed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
        >
          <Card className="h-[260px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              {/* Add admin-specific chart or info here */}
              <span className="text-gray-500">Admin chart 1</span>
            </div>
          </Card>
          <Card className="h-[260px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              {/* Add admin-specific chart or info here */}
              <span className="text-gray-500">Admin chart 2</span>
            </div>
          </Card>
          <Card className="h-[260px] flex flex-col justify-center bg-gray-100 dark:bg-gray-800 shadow-lg rounded-2xl p-4 hover:shadow-xl transition-shadow border-t-4 border-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              {/* Add admin-specific chart or info here */}
              <span className="text-gray-500">Admin chart 3</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
