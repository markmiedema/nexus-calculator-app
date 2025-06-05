import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { MonthlyRevenue } from '../../types';
import { APP_CONFIG } from '../../config';

interface RevenueChartProps {
  stateData: MonthlyRevenue[];
  threshold: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ stateData, threshold }) => {
  // Sort and prepare cumulative data
  const sortedData = [...stateData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  let cumulative = 0;
  const chartData = sortedData.map(item => {
    cumulative += item.revenue;
    return {
      month: new Date(item.date).toLocaleDateString('en-US', APP_CONFIG.dateFormats.chart),
      revenue: item.revenue,
      cumulative: cumulative,
      transactions: item.transactions
    };
  });

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={APP_CONFIG.chartColors.grid} />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip 
          formatter={(value: number) => formatCurrency(value)}
          labelStyle={{ color: '#333' }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke={APP_CONFIG.chartColors.secondary}
          strokeWidth={2}
          name="Monthly Revenue"
          dot={{ r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="cumulative" 
          stroke={APP_CONFIG.chartColors.primary}
          strokeWidth={3}
          name="Cumulative Revenue"
          dot={{ r: 3 }}
        />
        <ReferenceLine 
          y={threshold} 
          stroke={APP_CONFIG.chartColors.danger}
          strokeDasharray="5 5"
          label={{ value: "Nexus Threshold", position: "right" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;