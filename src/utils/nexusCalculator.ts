import { MonthlyRevenue } from '../types';
import { determineStateThresholds } from '../constants/stateThresholds';

interface NexusResult {
  hasNexus: boolean;
  nexusDate: string | null;
  thresholdType: 'revenue' | 'transactions' | null;
  preNexusRevenue: number;
  postNexusRevenue: number;
  nexusThresholdAmount: number;
  yearlyBreaches: {
    [year: string]: {
      hasNexus: boolean;
      nexusDate: string | null;
      thresholdType: 'revenue' | 'transactions' | null;
      revenue: number;
      transactions: number;
    }
  };
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
      nexusDate: null,
      thresholdType: null,
      preNexusRevenue: 0,
      postNexusRevenue: 0,
      nexusThresholdAmount: 0,
      yearlyBreaches: {}
    };
  }

  // Sort monthly data by date
  const sortedData = [...monthlyData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Track yearly totals and breaches
  const yearlyBreaches: {
    [year: string]: {
      hasNexus: boolean;
      nexusDate: string | null;
      thresholdType: 'revenue' | 'transactions' | null;
      revenue: number;
      transactions: number;
    }
  } = {};
  
  let currentYear = '';
  let yearlyRevenue = 0;
  let yearlyTransactions = 0;
  let firstBreachYear = '';
  let firstBreachDate = null;
  let firstBreachType: 'revenue' | 'transactions' | null = null;
  let preNexusRevenue = 0;
  let postNexusRevenue = 0;
  
  // Process each month chronologically
  for (const month of sortedData) {
    const monthDate = new Date(month.date);
    const year = monthDate.getFullYear().toString();
    
    // Reset counters when year changes
    if (year !== currentYear) {
      // Store previous year's data if we were tracking a year
      if (currentYear) {
        yearlyBreaches[currentYear] = {
          hasNexus: yearlyRevenue >= revenueThreshold || 
                   (transactionThreshold !== null && yearlyTransactions >= transactionThreshold),
          nexusDate: yearlyBreaches[currentYear]?.nexusDate || null,
          thresholdType: yearlyBreaches[currentYear]?.thresholdType || null,
          revenue: yearlyRevenue,
          transactions: yearlyTransactions
        };
      }
      
      // Reset for new year
      currentYear = year;
      yearlyRevenue = 0;
      yearlyTransactions = 0;
      
      // Initialize the year in our tracking object
      if (!yearlyBreaches[currentYear]) {
        yearlyBreaches[currentYear] = {
          hasNexus: false,
          nexusDate: null,
          thresholdType: null,
          revenue: 0,
          transactions: 0
        };
      }
    }
    
    // Add to yearly totals
    yearlyRevenue += month.revenue;
    yearlyTransactions += month.transactions;
    
    // Check if this month triggered nexus for the current year
    const hasRevenueNexus = yearlyRevenue >= revenueThreshold;
    const hasTransactionNexus = transactionThreshold !== null && yearlyTransactions >= transactionThreshold;
    
    // If nexus is triggered and we haven't recorded it for this year yet
    if ((hasRevenueNexus || hasTransactionNexus) && !yearlyBreaches[currentYear].hasNexus) {
      const thresholdType = hasRevenueNexus ? 'revenue' : 'transactions';
      yearlyBreaches[currentYear] = {
        hasNexus: true,
        nexusDate: month.date,
        thresholdType,
        revenue: yearlyRevenue,
        transactions: yearlyTransactions
      };
      
      // If this is the first breach across all years, record it
      if (!firstBreachDate) {
        firstBreachYear = currentYear;
        firstBreachDate = month.date;
        firstBreachType = thresholdType;
      }
    }
  }
  
  // Store the last year's data if we were tracking a year
  if (currentYear && !yearlyBreaches[currentYear].hasNexus) {
    yearlyBreaches[currentYear] = {
      hasNexus: yearlyRevenue >= revenueThreshold || 
               (transactionThreshold !== null && yearlyTransactions >= transactionThreshold),
      nexusDate: yearlyBreaches[currentYear]?.nexusDate || null,
      thresholdType: yearlyBreaches[currentYear]?.thresholdType || null,
      revenue: yearlyRevenue,
      transactions: yearlyTransactions
    };
  }
  
  // Calculate pre and post nexus revenue
  if (firstBreachDate) {
    // Calculate revenue before and after the first breach date
    for (const month of sortedData) {
      if (new Date(month.date) < new Date(firstBreachDate)) {
        preNexusRevenue += month.revenue;
      } else {
        postNexusRevenue += month.revenue;
      }
    }
  } else {
    // If no nexus, all revenue is pre-nexus
    preNexusRevenue = totalRevenue;
  }
  
  return {
    hasNexus: firstBreachDate !== null,
    nexusDate: firstBreachDate,
    thresholdType: firstBreachType,
    preNexusRevenue,
    postNexusRevenue,
    nexusThresholdAmount: firstBreachType === 'revenue' ? revenueThreshold : 
                         (firstBreachType === 'transactions' ? transactionThreshold || 0 : 0),
    yearlyBreaches
  };
};

// Function to determine if a specific date is within the nexus period
export const isWithinNexusPeriod = (date: string, nexusDate: string | null): boolean => {
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