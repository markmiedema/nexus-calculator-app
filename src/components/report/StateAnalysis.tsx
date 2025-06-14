import React, { useState } from 'react';
import { ProcessedData, NexusState, SalesByState } from '../../types';
import RevenueChart from '../visualizations/RevenueChart';
import { Filter, ArrowUp, ArrowDown, TrendingUp, AlertCircle, Clock } from 'lucide-react';

interface StateAnalysisProps {
  data: ProcessedData;
}

const StateAnalysis: React.FC<StateAnalysisProps> = ({ data }) => {
  const { nexusStates, salesByState } = data;
  const [sortField, setSortField] = useState<'name' | 'totalRevenue' | 'thresholdProximity'>('thresholdProximity');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedState, setSelectedState] = useState<SalesByState | null>(
    salesByState.length > 0 ? salesByState[0] : null
  );

  // Sort states based on current sort field and direction
  const sortedStates = [...salesByState].sort((a, b) => {
    if (sortField === 'name') {
      return sortDirection === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      const aValue = a[sortField];
      const bValue = b[sortField];
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getThresholdStatus = (state: SalesByState) => {
    const nexusState = nexusStates.find(n => n.code === state.code);
    
    if (nexusState) {
      return {
        message: nexusState.calculationMethod === 'rolling-12-month' 
          ? 'Nexus threshold exceeded (rolling 12-month)' 
          : 'Nexus threshold exceeded',
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        className: 'text-red-600'
      };
    }
    
    if (state.thresholdProximity >= 100) {
      return {
        message: 'Nexus threshold exceeded',
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        className: 'text-red-600'
      };
    }
    
    if (state.thresholdProximity >= 75) {
      return {
        message: 'Approaching nexus threshold',
        icon: <TrendingUp className="h-4 w-4 text-amber-600" />,
        className: 'text-amber-600'
      };
    }
    
    return {
      message: `${Math.max(0, state.revenueThreshold - state.totalRevenue).toLocaleString()} until threshold`,
      icon: null,
      className: 'text-gray-600'
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">State Sales Analysis</h2>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">Sort by:</span>
          <select 
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={sortField}
            onChange={(e) => handleSort(e.target.value as typeof sortField)}
          >
            <option value="name">State Name</option>
            <option value="totalRevenue">Revenue</option>
            <option value="thresholdProximity">Threshold Proximity</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">States with Sales Activity</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {sortedStates.map((state) => {
              const status = getThresholdStatus(state);
              const nexusState = nexusStates.find(n => n.code === state.code);
              
              return (
                <button
                  key={state.code}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedState?.code === state.code ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedState(state)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-800">{state.name}</span>
                      <span className="ml-1 text-xs text-gray-500">({state.code})</span>
                      {nexusState?.calculationMethod === 'rolling-12-month' && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Clock className="h-3 w-3 mr-0.5" />
                          Rolling
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ${state.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {state.thresholdProximity}% of threshold
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        state.thresholdProximity >= 100 ? 'bg-red-500' :
                        state.thresholdProximity >= 75 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(state.thresholdProximity, 100)}%` }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedState ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedState.name}</h3>
                  <p className="text-gray-500">Sales Analysis</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${selectedState.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-gray-500 text-sm">Total Revenue</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Revenue Progression</h4>
                <div className="h-64 bg-white">
                  <RevenueChart stateData={selectedState.monthlyRevenue} threshold={selectedState.revenueThreshold} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Revenue Threshold</p>
                  <p className="text-xl font-bold text-gray-800">
                    ${selectedState.revenueThreshold.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Transaction Count</p>
                  <p className="text-xl font-bold text-gray-800">
                    {selectedState.transactionCount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Threshold Proximity</p>
                  <p className="text-xl font-bold text-gray-800">{selectedState.thresholdProximity}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Estimated Tax Rate</p>
                  <p className="text-xl font-bold text-gray-800">{selectedState.taxRate}%</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Threshold Analysis</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Current Revenue</span>
                        <span className="text-gray-800 font-medium">
                          ${selectedState.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            selectedState.thresholdProximity >= 100 ? 'bg-red-500' :
                            selectedState.thresholdProximity >= 75 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(selectedState.thresholdProximity, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm flex items-center">
                      {getThresholdStatus(selectedState).icon}
                      <span className={`${getThresholdStatus(selectedState).className} ${getThresholdStatus(selectedState).icon ? 'ml-1' : ''}`}>
                        {getThresholdStatus(selectedState).message}
                      </span>
                    </div>
                    
                    {/* Rolling 12-Month Analysis */}
                    {nexusStates.find(n => n.code === selectedState.code)?.calculationMethod === 'rolling-12-month' && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md">
                        <div className="flex items-center text-sm text-blue-700">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Nexus triggered using rolling 12-month calculation</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center h-full">
              <p className="text-gray-500">Select a state to view detailed analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StateAnalysis;