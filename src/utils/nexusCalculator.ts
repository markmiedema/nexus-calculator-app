import { MonthlyRevenue } from '../types';
import { determineStateThresholds } from '../constants/stateThresholds';

interface NexusResult {
  hasNexus: boolean;
  nexusDate: string;
  thresholdType: 'revenue' | 'transactions';
  preNexusRevenue: number;
  postNexusRevenue: number;
  nexusThresholdAmount: number;
  nexusYear: string;
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
      nexusThresholdAmount: 0,
      nexusYear: ''
    };
  }

  // Sort monthly data by date
  const sortedData = [...monthlyData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Group data by year and check each year independently
  const yearlyData: { [year: string]: { revenue: number; transactions: number; firstDate: string } } = {};
  
  sortedData.forEach(month => {
    const year = month.date.substring(0, 4);
    if (!yearlyData[year]) {
      yearlyData[year] = { revenue: 0, transactions: 0, firstDate: month.date };
    }
    yearlyData[year].revenue += month.revenue;
    yearlyData[year].transactions += month.transactions;
    if (month.date < yearlyData[year].firstDate) {
      yearlyData[year].firstDate = month.date;
    }
  });
  
  // Check each year for nexus (NON-CUMULATIVE)
  let earliestNexusYear: string | null = null;
  let nexusDate = '';
  let thresholdType: 'revenue' | 'transactions' = 'revenue';
  let nexusThresholdAmount = 0;
  
  for (const [year, data] of Object.entries(yearlyData)) {
    // Check if this year alone meets the threshold
    const hasRevenueNexus = data.revenue >= revenueThreshold;
    const hasTransactionNexus = transactionThreshold !== null && data.transactions >= transactionThreshold;
    
    if (hasRevenueNexus || hasTransactionNexus) {
      if (!earliestNexusYear || year < earliestNexusYear) {
        earliestNexusYear = year;
        nexusDate = data.firstDate;
        thresholdType = hasRevenueNexus ? 'revenue' : 'transactions';
        nexusThresholdAmount = hasRevenueNexus ? revenueThreshold : (transactionThreshold || 0);
      }
    }
  }
  
  if (!earliestNexusYear) {
    return {
      hasNexus: false,
      nexusDate: '',
      thresholdType: 'revenue',
      preNexusRevenue: totalRevenue,
      postNexusRevenue: 0,
      nexusThresholdAmount: revenueThreshold,
      nexusYear: ''
    };
  }
  
  // Calculate pre and post nexus revenue
  let preNexusRevenue = 0;
  let postNexusRevenue = 0;
  
  for (const [year, data] of Object.entries(yearlyData)) {
    if (year < earliestNexusYear) {
      preNexusRevenue += data.revenue;
    } else {
      postNexusRevenue += data.revenue;
    }
  }
  
  return {
    hasNexus: true,
    nexusDate,
    thresholdType,
    preNexusRevenue,
    postNexusRevenue,
    nexusThresholdAmount,
    nexusYear: earliestNexusYear
  };
};

// Function to determine if a specific date is within the nexus period
export const isWithinNexusPeriod = (date: string, nexusDate: string): boolean => {
  if (!nexusDate) return false;
  
  const checkDate = new Date(date);
  const startDate = new Date(nexusDate);
  
  return checkDate >= startDate;
};

// Calculate remaining time until nexus is established for CURRENT YEAR
export const calculateRemainingToNexus = (
  stateCode: string,
  currentYearRevenue: number,
  currentYearTransactions: number
): { remainingRevenue: number; remainingTransactions: number | null } => {
  const { revenue: revenueThreshold, transactions: transactionThreshold } = determineStateThresholds(stateCode);
  
  const remainingRevenue = Math.max(0, revenueThreshold - currentYearRevenue);
  const remainingTransactions = transactionThreshold !== null 
    ? Math.max(0, transactionThreshold - currentYearTransactions)
    : null;
  
  return {
    remainingRevenue,
    remainingTransactions,
  };
};