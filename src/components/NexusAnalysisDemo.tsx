import React, { useState } from 'react';
import { useNexusAnalysis } from '../hooks/useNexusAnalysis';
import { EngineOptions, NexusResult } from '../utils/nexusEngine/types';
import { getStateName } from '../utils/nexusEngine/rules';
import { AlertCircle, CheckCircle, TrendingUp, Cpu, Clock } from 'lucide-react';

const NexusAnalysisDemo: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [ignoreMarketplace, setIgnoreMarketplace] = useState<boolean>(true);
  const [includeNegativeAmounts, setIncludeNegativeAmounts] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<'singleYear' | 'multiYearEstimate'>('singleYear');
  const [yearRange, setYearRange] = useState<[number, number]>([
    new Date().getFullYear() - 3,
    new Date().getFullYear()
  ]);
  
  const {
    analyzeTransactions,
    isAnalyzing,
    progress,
    result,
    error,
    isWorkerAvailable,
    getNexusStates,
    getApproachingStates,
    getSafeStates
  } = useNexusAnalysis();
  
  // Sample transaction data for demo
  const generateSampleData = () => {
    const currentYear = new Date().getFullYear();
    const transactions = [];
    
    // Generate CA transactions (will exceed threshold)
    for (let i = 1; i <= 6; i++) {
      transactions.push({
        id: `ca-${i}`,
        state: 'CA',
        amount: 100000,
        date: new Date(`${currentYear}-${String(i).padStart(2, '0')}-15`)
      });
    }
    
    // Generate NY transactions (will approach threshold)
    for (let i = 1; i <= 4; i++) {
      transactions.push({
        id: `ny-${i}`,
        state: 'NY',
        amount: 100000,
        date: new Date(`${currentYear}-${String(i).padStart(2, '0')}-15`)
      });
    }
    
    // Generate TX transactions (will be safe)
    for (let i = 1; i <= 2; i++) {
      transactions.push({
        id: `tx-${i}`,
        state: 'TX',
        amount: 50000,
        date: new Date(`${currentYear}-${String(i).padStart(2, '0')}-15`)
      });
    }
    
    // Generate WA transactions (will exceed transaction threshold)
    for (let i = 1; i <= 250; i++) {
      transactions.push({
        id: `wa-${i}`,
        state: 'WA',
        amount: 500,
        date: new Date(`${currentYear}-01-${Math.min(i, 28)}`)
      });
    }
    
    // Generate marketplace transactions
    for (let i = 1; i <= 5; i++) {
      transactions.push({
        id: `mp-${i}`,
        state: 'FL',
        amount: 50000,
        date: new Date(`${currentYear}-${String(i).padStart(2, '0')}-15`),
        revenue_type: 'marketplace'
      });
    }
    
    // Generate negative transactions (returns)
    transactions.push({
      id: 'return-1',
      state: 'CA',
      amount: -50000,
      date: new Date(`${currentYear}-07-15`)
    });
    
    // Generate historical transactions for multi-year
    const prevYear = currentYear - 1;
    for (let i = 1; i <= 12; i++) {
      transactions.push({
        id: `hist-${i}`,
        state: 'GA',
        amount: 10000,
        date: new Date(`${prevYear}-${String(i).padStart(2, '0')}-15`)
      });
    }
    
    return transactions;
  };
  
  const handleRunAnalysis = async () => {
    try {
      const sampleData = generateSampleData();
      
      const options: EngineOptions = {
        mode: selectedMode,
        analysisYear: selectedYear,
        yearRange: yearRange,
        ignoreMarketplace,
        includeNegativeAmounts
      };
      
      await analyzeTransactions(sampleData, options);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };
  
  const renderStateCard = (state: NexusResult, type: 'nexus' | 'approaching' | 'safe') => {
    const getStatusColor = () => {
      switch (type) {
        case 'nexus': return 'bg-red-100 text-red-800 border-red-200';
        case 'approaching': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'safe': return 'bg-green-100 text-green-800 border-green-200';
      }
    };
    
    const getStatusIcon = () => {
      switch (type) {
        case 'nexus': return <AlertCircle className="h-5 w-5 text-red-600" />;
        case 'approaching': return <TrendingUp className="h-5 w-5 text-yellow-600" />;
        case 'safe': return <CheckCircle className="h-5 w-5 text-green-600" />;
      }
    };
    
    return (
      <div className={`p-4 rounded-lg border ${getStatusColor()} mb-2`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {getStatusIcon()}
            <div className="ml-2">
              <h3 className="font-medium">{getStateName(state.state_code)}</h3>
              <p className="text-sm">{state.state_code}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">${state.total_revenue?.toLocaleString()}</div>
            <div className="text-sm">{state.total_transactions} transactions</div>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Threshold: ${state.threshold_revenue?.toLocaleString()}</span>
            <span>{state.threshold_percentage?.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                type === 'nexus' ? 'bg-red-500' : 
                type === 'approaching' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, state.threshold_percentage || 0)}%` }}
            ></div>
          </div>
        </div>
        
        {state.first_breach_date && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Nexus triggered:</span> {state.first_breach_date.toLocaleDateString()}
            {state.breach_type && (
              <span className="ml-1">({state.breach_type})</span>
            )}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Nexus Analysis Demo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Analysis Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Analysis Mode
                </label>
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="singleYear">Single Year</option>
                  <option value="multiYearEstimate">Multi-Year Estimate</option>
                </select>
              </div>
              
              {selectedMode === 'singleYear' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Analysis Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Range
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={yearRange[0]}
                      onChange={(e) => setYearRange([parseInt(e.target.value), yearRange[1]])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i - 2).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <span>to</span>
                    <select
                      value={yearRange[1]}
                      onChange={(e) => setYearRange([yearRange[0], parseInt(e.target.value)])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ignoreMarketplace}
                    onChange={(e) => setIgnoreMarketplace(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Ignore marketplace facilitator sales</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeNegativeAmounts}
                    onChange={(e) => setIncludeNegativeAmounts(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include negative amounts (returns/refunds)</span>
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Processing Information</h3>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center mb-3">
                {isWorkerAvailable ? (
                  <div className="flex items-center text-green-600">
                    <Cpu className="h-5 w-5 mr-2" />
                    <span className="font-medium">Web Worker Available</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-600">
                    <Cpu className="h-5 w-5 mr-2" />
                    <span className="font-medium">Using Main Thread</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                This demo uses sample transaction data to demonstrate the Nexus Engine.
                In a real application, you would upload your own transaction data.
              </p>
              
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {isAnalyzing ? 'Analyzing...' : 'Run Analysis with Sample Data'}
              </button>
              
              {isAnalyzing && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Processing...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {result && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Analysis Results</h3>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Processed in {result.processingTime}ms</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="flex items-center text-md font-medium text-red-800 mb-3">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Nexus Established ({getNexusStates().length})
                </h4>
                <div className="space-y-2">
                  {getNexusStates().length > 0 ? (
                    getNexusStates().map(state => renderStateCard(state, 'nexus'))
                  ) : (
                    <p className="text-sm text-gray-600 italic">No states with established nexus</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="flex items-center text-md font-medium text-yellow-800 mb-3">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Approaching Threshold ({getApproachingStates().length})
                </h4>
                <div className="space-y-2">
                  {getApproachingStates().length > 0 ? (
                    getApproachingStates().map(state => renderStateCard(state, 'approaching'))
                  ) : (
                    <p className="text-sm text-gray-600 italic">No states approaching threshold</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="flex items-center text-md font-medium text-green-800 mb-3">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Safe Zone ({getSafeStates().length})
                </h4>
                <div className="space-y-2">
                  {getSafeStates().slice(0, 5).map(state => renderStateCard(state, 'safe'))}
                  {getSafeStates().length > 5 && (
                    <p className="text-sm text-gray-600 italic">
                      +{getSafeStates().length - 5} more states
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {result.warnings.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Processing Warnings</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NexusAnalysisDemo;