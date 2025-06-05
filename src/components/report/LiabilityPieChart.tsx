import React from 'react';
import { NexusState } from '../../types';

interface LiabilityPieChartProps {
  states: NexusState[];
}

const LiabilityPieChart: React.FC<LiabilityPieChartProps> = ({ states }) => {
  // Sort states by liability (descending)
  const sortedStates = [...states].sort((a, b) => b.liability - a.liability);
  
  // Take top 5 states for display, group others as "Other"
  const topStates = sortedStates.slice(0, 5);
  const otherStates = sortedStates.slice(5);
  const otherLiability = otherStates.reduce((sum, state) => sum + state.liability, 0);
  
  const totalLiability = states.reduce((sum, state) => sum + state.liability, 0);

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="text-center mb-4">
        <p className="text-gray-500 text-sm">Tax Liability Distribution</p>
      </div>
      
      <div className="w-full h-44 bg-gray-100 rounded-md flex items-center justify-center">
        <p className="text-gray-400 text-sm">
          Pie chart visualization would render here, showing liability distribution
        </p>
      </div>
      
      <div className="mt-4 w-full">
        <div className="grid grid-cols-2 gap-2">
          {topStates.map(state => (
            <div key={state.code} className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-700">{state.name}</span>
              <span className="ml-auto text-gray-900 font-medium">
                ${state.liability.toLocaleString()} 
                <span className="text-gray-500 ml-1">
                  ({((state.liability / totalLiability) * 100).toFixed(2)}%)
                </span>
              </span>
            </div>
          ))}
          
          {otherLiability > 0 && (
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
              <span className="text-gray-700">Other States</span>
              <span className="ml-auto text-gray-900 font-medium">
                ${otherLiability.toLocaleString()}
                <span className="text-gray-500 ml-1">
                  ({((otherLiability / totalLiability) * 100).toFixed(2)}%)
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiabilityPieChart;