import React from "react";
import { Line } from "react-chartjs-2";

interface SalesTargetProps {
  repData: any;
  chartData: any;
  chartOptions: any;
  percentageAchieved: number;
}

const SalesTarget: React.FC<SalesTargetProps> = ({
  repData,
  chartData,
  chartOptions,
  percentageAchieved,
}) => (
  <>
    <p className="text-base mb-1 text-green-700 font-medium">
      {percentageAchieved}% of your monthly sales target achieved!
    </p>
    <div className="bg-white rounded shadow p-2 flex-1 min-h-0">
      <Line data={chartData} options={chartOptions} />
    </div>
  </>
);

export default SalesTarget;