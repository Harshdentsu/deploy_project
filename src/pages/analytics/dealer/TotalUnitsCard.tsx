import React from "react";
import CountUp from "react-countup";

interface TotalUnitsCardProps {
  totalUnits: number;
  iconSrc?: string;
}

const TotalUnitsCard: React.FC<TotalUnitsCardProps> = ({
  totalUnits,
  iconSrc = "/supply.png",
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-24 w-full px-4 bg-gray-50 dark:bg-gray-800 border-b-4 border-gray-300 shadow hover:shadow-lg transition-shadow rounded-lg">
      <div className="flex items-center justify-center space-x-2 mb-1">
        <img src={iconSrc} alt="Units Icon" className="w-6 h-6 opacity-80" />
        <span className="text-base font-medium text-gray-700 dark:text-gray-300">
          Total Units Ordered
        </span>
      </div>
      <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
        <CountUp end={totalUnits} duration={1.5} />
      </span>
    </div>
  );
};

export default TotalUnitsCard;
