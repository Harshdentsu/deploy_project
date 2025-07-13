import React from "react";
import CountUp from "react-countup";

interface TotalSalesCardProps {
  totalSales: number;
  iconSrc?: string;
}

const TotalSalesCard: React.FC<TotalSalesCardProps> = ({
  totalSales,
  iconSrc = "/stock.png", // default icon path
}) => {
  return (
    <div className="flex flex-col justify-center items-center h-24 w-full px-4 bg-gray-50 dark:bg-gray-800 border-b-4 border-gray-300 shadow hover:shadow-lg transition-shadow rounded-lg">
      <div className="flex items-center justify-center space-x-2 mb-1">
        {iconSrc && (
          <img src={iconSrc} alt="Sales Icon" className="w-6 h-6 opacity-80" />
        )}
        <span className="text-base font-medium text-gray-700 dark:text-gray-300">
          Total Sales
        </span>
      </div>
      <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
        ₹<CountUp end={totalSales} duration={1.5} separator="," />
      </span>
    </div>
  );
};

export default TotalSalesCard;
