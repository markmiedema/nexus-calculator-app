import { MonthlyRevenue } from '../types';
import { determineStateThresholds } from '../constants/stateThresholds';

interface NexusResult {
  hasNexus: boolean;
  nexusDate: string;
  thresholdType: 'revenue' | 'transactions';
  preNexusRevenue: number;
  postNexusRevenue: number;
  nexusThresholdAmount: number;
}

export const calculateNexus = (
  stateCode: string,
  totalRevenue: number,
  transactionCount: number,
  monthlyData: MonthlyRevenue[]
): NexusResult => {
  // Get state thresholds
  const { revenue: revenueThreshold, transactions: transactionThreshold } = determineStateThresholds(stateCode);
  
  // Check if state has no sales tax
  if (revenueThreshold === 0) {
    return {
      hasNexus: false,
      nexusDate: '',
      thresholdType: 'revenue',
      preNexusRevenue: 0,
      postNexusRevenue: 0,
      nexusThresholdAmount: 0
    };
  }

  // Sort monthly data by date
  const sortedData = [...monthlyData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Calculate running totals
  let runningRevenue = 0;
  let runningTransactions = 0;
  let nexusDate = '';
  let thresholdType: 'revenue' | 'transactions' = 'revenue';
  let preNexusRevenue = 0;
  let postNexusRevenue = 0;
  let nexusThresholdAmount = 0;
  
  for (const month of sortedData) {
    const monthRevenue = month.revenue;
    const monthTransactions = month.transactions;
    
    // Check if nexus is already established
    if (!nexusDate) {
      // Add to running totals
      runningRevenue += monthRevenue;
      runningTransactions += monthTransactions;
      
      // Check revenue threshold
      if (runningRevenue >= revenueThreshold) {
        nexusDate = month.date;
        thresholdType = 'revenue';
        nexusThresholdAmount = revenueThreshold;
        preNexusRevenue = runningRevenue - monthRevenue; // Exclude the transaction that crossed threshold
        postNexusRevenue = monthRevenue; // Only include amount after crossing threshold
      } 
      // Only check transaction threshold if it exists for this state
      else if (transactionThreshold !== null && runningTransactions >= transactionThreshold) {
        nexusDate = month.date;
        thresholdType = 'transactions';
        nexusThresholdAmount = transactionThreshold;
        preNexusRevenue = runningRevenue - monthRevenue;
        postNexusRevenue = monthRevenue;
      }
    } else {
      // After nexus is established, all revenue is taxable
      postNexusRevenue += monthRevenue;
    }
  }
  
  return {
    hasNexus: nexusDate !== '',
    nexusDate,
    thresholdType,
    preNexusRevenue,
    postNexusRevenue,
    nexusThresholdAmount
  };
};

// Function to determine if a specific date is within the nexus period
export const isWithinNexusPeriod = (date: string, nexusDate: string): boolean => {
  if (!nexusDate) return false;
  
  const checkDate = new Date(date);
  const startDate = new Date(nexusDate);
  
  return checkDate >= startDate;
};

// Calculate remaining time until nexus is established
export const calculateRemainingToNexus = (
  stateCode: string,
  currentRevenue: number,
  currentTransactions: number
): { remainingRevenue: number; remainingTransactions: number | null } => {
  const { revenue: revenueThreshold, transactions: transactionThreshold } = determineStateThresholds(stateCode);
  
  const remainingRevenue = Math.max(0, revenueThreshold - currentRevenue);
  const remainingTransactions = transactionThreshold !== null 
    ? Math.max(0, transactionThreshold - currentTransactions)
    : null;
  
  return {
    remainingRevenue,
    remainingTransactions,
  };
};