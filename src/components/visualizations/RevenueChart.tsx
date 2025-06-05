import React from 'react';
import { MonthlyRevenue } from '../../types';

interface RevenueChartProps {
  stateData: MonthlyRevenue[];
  nexusDate: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ stateData, nexusDate }) => {
  // This is a simplified component that would show a line chart of revenue progression
  // In a real implementation, this would use a charting library like Chart.js, Recharts, or similar
  
  // Sort the data by date
  const sortedData = [...stateData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Find the maximum revenue for scaling
  const maxRevenue = Math.max(...sortedData.map(item => item.revenue));
  
  // Find the index of the nexus date
  const nexusDateObj = new Date(nexusDate);
  const nexusIndex = sortedData.findIndex(item => 
    new Date(item.date) >= nexusDateObj
  );

  return (
    <div className="h-full flex flex-col">
      <div className="text-center mb-2">
        <p className="text-gray-500 text-sm">Monthly Revenue Progression</p>
      </div>
      
      <div className="w-full flex-grow bg-gray-100 rounded-md flex items-center justify-center">
        <p className="text-gray-400 text-sm">
          Line chart visualization would render here, showing revenue over time with nexus threshold marked
        </p>
      </div>
      
      <div className="mt-2 flex justify-between text-xs">
        <div className="flex items-center">
          <div className="w-3 h-1 bg-blue-500 mr-1"></div>
          <span className="text-gray-600">Revenue</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-1 bg-red-500 mr-1"></div>
          <span className="text-gray-600">Nexus Threshold</span>
        </div>
        <div className="flex items-center">
          <div className="w-1 h-3 bg-green-500 mr-1"></div>
          <span className="text-gray-600">Nexus Date: {nexusDate}</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;