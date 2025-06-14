// useNexusAnalysis hook
// React hook for integrating the Nexus Engine with the application

import { useState, useCallback } from 'react';
import { useNexusEngineWorker, useNexusEngine } from '../utils/nexusEngine/hooks';
import { TransactionRow, EngineOptions, EngineResult, NexusResult } from '../utils/nexusEngine/types';
import { isWebWorkerSupported } from '../utils/workerFallback';
import { calculateRolling12MonthNexus } from '../utils/nexusCalculator';

/**
 * Hook for analyzing nexus status from transaction data
 */
export function useNexusAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use worker if available, otherwise use direct engine
  const useWorker = isWebWorkerSupported();
  const workerEngine = useNexusEngineWorker();
  const directEngine = useNexusEngine();
  
  const engine = useWorker ? workerEngine : directEngine;
  
  const analyzeTransactions = useCallback(async (
    transactions: any[],
    options: Partial<EngineOptions> = {}
  ) => {
    setIsAnalyzing(true);
    setProgress(0);
    setResult(null);
    setError(null);
    
    try {
      // Map raw transaction data to TransactionRow format
      const mappedTransactions: TransactionRow[] = transactions.map((row, index) => ({
        id: row.id || `tx-${index}`,
        state_code: row.state || row.state_code,
        amount: parseFloat(row.sale_amount || row.amount || 0),
        date: new Date(row.date || row.transaction_date),
        revenue_type: mapRevenueType(row.revenue_type)
      }));
      
      // Set default options
      const defaultOptions: EngineOptions = {
        mode: 'singleYear',
        analysisYear: new Date().getFullYear(),
        ignoreMarketplace: false,
        includeNegativeAmounts: false,
        useRolling12Month: false
      };
      
      // Merge with user options
      const mergedOptions: EngineOptions = {
        ...defaultOptions,
        ...options
      };
      
      // Run analysis
      const analysisResult = await engine.analyze(mappedTransactions, mergedOptions);
      
      // If rolling 12-month calculation is enabled, enhance the results
      if (mergedOptions.useRolling12Month) {
        // Process each state for rolling 12-month calculation
        analysisResult.nexusResults = analysisResult.nexusResults.map(stateResult => {
          // Get transactions for this state
          const stateTransactions = mappedTransactions.filter(
            tx => tx.state_code === stateResult.state_code
          );
          
          // Skip if no transactions
          if (stateTransactions.length === 0) return stateResult;
          
          // Convert to monthly data format
          const monthlyData = stateTransactions.map(tx => ({
            date: tx.date.toISOString().split('T')[0],
            revenue: tx.amount,
            transactions: 1
          }));
          
          // Calculate rolling 12-month nexus
          const rollingResult = calculateRolling12MonthNexus(
            monthlyData,
            stateResult.threshold_revenue || 0,
            stateResult.threshold_transactions
          );
          
          // If rolling breach found
          if (rollingResult.breachDate) {
            // Add rolling breach details
            return {
              ...stateResult,
              rolling_breach: true,
              rolling_breach_date: new Date(rollingResult.breachDate),
              rolling_breach_type: rollingResult.breachType,
              // If no calendar year breach but rolling breach found, use rolling breach
              exceeded: stateResult.exceeded || true,
              first_breach_date: stateResult.first_breach_date || new Date(rollingResult.breachDate),
              breach_type: stateResult.breach_type || rollingResult.breachType
            };
          }
          
          return stateResult;
        });
      }
      
      // Update state
      setResult(analysisResult);
      setProgress(100);
      
      return analysisResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [engine]);
  
  // Helper to map revenue types from various formats
  const mapRevenueType = (type?: string): TransactionRow['revenue_type'] | undefined => {
    if (!type) return undefined;
    
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('marketplace') || lowerType === 'mf') {
      return 'marketplace';
    }
    
    if (lowerType.includes('non') || lowerType === 'exempt' || lowerType === 'non-taxable') {
      return 'nontaxable';
    }
    
    if (lowerType === 'taxable' || lowerType === 'tax') {
      return 'taxable';
    }
    
    return undefined;
  };
  
  // Get states with nexus
  const getNexusStates = useCallback((): NexusResult[] => {
    if (!result) return [];
    return result.nexusResults.filter(r => r.exceeded);
  }, [result]);
  
  // Get states approaching nexus (>75% of threshold)
  const getApproachingStates = useCallback((): NexusResult[] => {
    if (!result) return [];
    return result.nexusResults.filter(r => 
      !r.exceeded && 
      r.threshold_percentage !== undefined && 
      r.threshold_percentage >= 75 && 
      r.threshold_percentage < 100
    );
  }, [result]);
  
  // Get safe states (<75% of threshold)
  const getSafeStates = useCallback((): NexusResult[] => {
    if (!result) return [];
    return result.nexusResults.filter(r => 
      !r.exceeded && 
      (r.threshold_percentage === undefined || r.threshold_percentage < 75)
    );
  }, [result]);
  
  return {
    analyzeTransactions,
    isAnalyzing,
    progress,
    result,
    error,
    isWorkerAvailable: useWorker && workerEngine.isWorkerAvailable,
    getNexusStates,
    getApproachingStates,
    getSafeStates,
    reset: useCallback(() => {
      setIsAnalyzing(false);
      setProgress(0);
      setResult(null);
      setError(null);
    }, [])
  };
}