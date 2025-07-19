import React, { useEffect, useState } from "react";

export default function TopSellingSKUCard() {
  const [topSKU, setTopSKU] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const salesRepId = user.sales_rep_id || localStorage.getItem("sales_rep_id");
    const API_URL = import.meta.env.VITE_API_URL;

    fetch(`${API_URL}/top-selling-skus?sales_rep_id=${salesRepId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setTopSKU(data[0]); // ✅ Get top 1 SKU
        }
      })
      .catch(console.error);
  }, []);

  if (!topSKU) {
    return (
      <div className="flex flex-col items-center justify-center h-24 w-full px-4 bg-gray-50 dark:bg-gray-800 border-b-4 border-gray-300 shadow rounded-lg">
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading top SKU…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-24 w-full px-4 bg-gray-50 dark:bg-gray-800 border-b-4 border-gray-300 shadow hover:shadow-lg transition-shadow rounded-lg">
      <div className="flex items-center justify-center space-x-2 mb-1">
        <img
          src="public/award.png"
          alt="Top SKU Icon"
          className="w-6 h-6 opacity-80"
        />
        <span className="text-base font-medium text-gray-700 dark:text-gray-300">
          Top Selling Product
        </span>
      </div>
      <span className="text-md font-extrabold text-gray-900 dark:text-gray-100 text-center">
        {topSKU.product_name}
      </span>
    </div>
  );
}
