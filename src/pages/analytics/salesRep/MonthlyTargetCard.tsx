import React from "react";
import CountUp from "react-countup";

interface MonthlyTargetCardProps {
  target: number;
  iconSrc?: string; // Optional icon path (e.g., "/target.png")
}

const MonthlyTargetCard: React.FC<MonthlyTargetCardProps> = ({
  target,
  iconSrc = "/target.png", // default icon
}) => {
    return (
        <div className="flex flex-col items-center justify-center h-24 w-full bg-gray-50 dark:bg-gray-800 border-b-4 border-gray-300 shadow hover:shadow-lg transition-shadow rounded-lg">
          
          {/* Icon + Label Row */}
          <div className="flex items-center gap-2 mb-1">
            {iconSrc && (
              <img src={iconSrc} alt="Target Icon" className="w-6 h-6 opacity-70" />
            )}
            <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
              Monthly Target
            </span>
          </div>
      
          {/* Value */}
          <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            ₹<CountUp end={target} duration={1.5} separator="," />
          </span>
        </div>
      );      
};

export default MonthlyTargetCard;
