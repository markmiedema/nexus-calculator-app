import React from 'react';
import { ProcessedData } from '../../types';
import { Shield, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface ExecutiveSummaryProps {
  data: ProcessedData;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ data }) => {
  const { nexusStates, totalLiability, priorityStates, dataRange, salesByState } = data;
  const hasNexus = nexusStates.length > 0;
  
  // Calculate states approaching nexus (>50% of threshold)
  const statesApproachingNexus = salesByState
    .filter(state => state.thresholdProximity >= 50 && state.thresholdProximity < 100 && !nexusStates.find(n => n.code === state.code))
    .sort((a, b) => b.thresholdProximity - a.thresholdProximity);

  // Calculate safe states (<50% of threshold)
  const safeStates = salesByState
    .filter(state => state.thresholdProximity < 50 && !nexusStates.find(n => n.code === state.code))
    .sort((a, b) => b.thresholdProximity - a.thresholdProximity);
  
  // Count states using rolling-12-month calculation
  const rollingNexusStates = nexusStates.filter(state => 
    state.calculationMethod === 'rolling-12-month'
  );
  
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Executive Summary</h2>
          
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {hasNexus ? (
                <>
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <div className="text-sm text-gray-500">Nexus Established In</div>
                    <div className="text-2xl font-bold text-blue-600">{nexusStates.length} States</div>
                    {rollingNexusStates.length > 0 && (
                      <div className="text-xs text-blue-500 mt-1">
                        {rollingNexusStates.length} using rolling 12-month
                      </div>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <div className="text-sm text-gray-500">Total Est. Liability</div>
                    <div className="text-2xl font-bold text-green-600">${totalLiability.toLocaleString()}</div>
                  </div>
                </>
              ) : (
                <div className="col-span-2 bg-green-50 p-4 rounded-md border border-green-200">
                  <div className="flex items-center">
                    <Shield className="h-6 w-6 text-green-600 mr-2" />
                    <div className="text-lg font-medium text-green-800">No Current SALT Obligations Found</div>
                  </div>
                  <p className="mt-1 text-sm text-green-700">
                    Analysis of {salesByState.length} states shows no nexus thresholds have been crossed.
                  </p>
                </div>
              )}
              <div className="bg-white p-4 rounded-md shadow-sm">
                <div className="text-sm text-gray-500">Analysis Period</div>
                <div className="text-lg font-medium text-gray-700">{dataRange.start} - {dataRange.end}</div>
              </div>
              <div className="bg-white p-4 rounded-md shadow-sm">
                <div className="text-sm text-gray-500">States with Sales</div>
                <div className="text-lg font-medium text-gray-700">{salesByState.length}</div>
              </div>
            </div>

            {hasNexus && (
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-700 mb-3">Priority States</h3>
                <div className="bg-white rounded-md shadow-sm divide-y divide-gray-100">
                  {priorityStates.map((state, index) => (
                    <div key={state.code} className="p-3 flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-800">{index + 1}. {state.name}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          Nexus since {state.nexusDate}
                          {state.calculationMethod === 'rolling-12-month' && (
                            <span className="ml-1 text-blue-500">(rolling)</span>
                          )}
                        </span>
                      </div>
                      <div className="font-semibold text-green-600">${state.liability.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Nexus Status Overview</h2>
          <div className="grid grid-cols-1 gap-4">
            {/* Nexus Established Section */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center mb-3">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="font-medium text-red-800">Nexus Established</h3>
              </div>
              <div className="space-y-2">
                {nexusStates.length > 0 ? (
                  nexusStates.map(state => (
                    <div key={state.code} className="bg-white rounded p-3 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{state.name}</span>
                        <span className="text-red-600 font-medium">${state.liability.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Nexus since {state.nexusDate}
                        {state.calculationMethod === 'rolling-12-month' && (
                          <span className="ml-1 text-blue-500">(rolling 12-month)</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No states with established nexus</p>
                )}
              </div>
            </div>

            {/* Approaching Threshold Section */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <div className="flex items-center mb-3">
                <TrendingUp className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="font-medium text-yellow-800">Approaching Threshold (50-99%)</h3>
              </div>
              <div className="space-y-2">
                {statesApproachingNexus.length > 0 ? (
                  statesApproachingNexus.map(state => (
                    <div key={state.code} className="bg-white rounded p-3 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{state.name}</span>
                        <span className="text-yellow-600 font-medium">{state.thresholdProximity}%</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        ${(state.revenueThreshold - state.totalRevenue).toLocaleString()} to threshold
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(state.thresholdProximity, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No states approaching threshold</p>
                )}
              </div>
            </div>

            {/* Safe Zone Section */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-medium text-green-800">Safe Zone (<50%)</h3>
              </div>
              <div className="space-y-2">
                {safeStates.length > 0 ? (
                  safeStates.map(state => (
                    <div key={state.code} className="bg-white rounded p-3 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{state.name}</span>
                        <span className="text-green-600 font-medium">{state.thresholdProximity}%</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(state.thresholdProximity, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No states in safe zone</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`border rounded-lg p-4 ${hasNexus ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
        <h3 className={`font-medium ${hasNexus ? 'text-blue-800' : 'text-green-800'}`}>Key Findings</h3>
        {hasNexus ? (
          <ul className="mt-2 text-blue-700 text-sm space-y-1 list-disc pl-5">
            <li>Your sales activities have triggered nexus in {nexusStates.length} states.</li>
            {rollingNexusStates.length > 0 && (
              <li>{rollingNexusStates.length} states triggered using rolling 12-month calculation.</li>
            )}
            <li>Top 3 states by liability: {priorityStates.slice(0, 3).map(s => s.name).join(', ')}.</li>
            <li>Immediate registration action is recommended for all states with established nexus.</li>
            <li>Total estimated tax liability across all states is ${totalLiability.toLocaleString()}.</li>
          </ul>
        ) : (
          <ul className="mt-2 text-green-700 text-sm space-y-1 list-disc pl-5">
            <li>Your sales activities have not triggered nexus obligations in any state.</li>
            {statesApproachingNexus.length > 0 && (
              <li>Monitor {statesApproachingNexus.map(s => s.name).join(', ')} as they approach thresholds.</li>
            )}
            <li>Continue tracking sales to ensure timely compliance when thresholds are met.</li>
            <li>Consider implementing automated nexus tracking for proactive monitoring.</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExecutiveSummary;