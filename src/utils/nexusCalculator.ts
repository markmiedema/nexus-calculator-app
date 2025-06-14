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
  // New field for rolling 12-month calculation
  rollingBreachDate: string | null;
  rollingBreachType: 'revenue' | 'transactions' | null;
}

/**
 * Calculate nexus status for a state based on revenue and transaction thresholds
 * Implements both calendar year and rolling 12-month calculations
 */
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
      yearlyBreaches: {},
      rollingBreachDate: null,
      rollingBreachType: null
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
  
  // Process each month chronologically for calendar year calculation
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
  
  // Implement rolling 12-month calculation
  let rollingBreachDate: string | null = null;
  let rollingBreachType: 'revenue' | 'transactions' | null = null;
  
  if (sortedData.length > 0) {
    // Implement sliding window approach
    const rollingResult = calculateRolling12MonthNexus(
      sortedData, 
      revenueThreshold, 
      transactionThreshold
    );
    
    rollingBreachDate = rollingResult.breachDate;
    rollingBreachType = rollingResult.breachType;
    
    // If rolling breach found but no calendar year breach, use rolling breach
    if (rollingBreachDate && !firstBreachDate) {
      firstBreachDate = rollingBreachDate;
      firstBreachType = rollingBreachType;
      
      // Recalculate pre and post nexus revenue
      preNexusRevenue = 0;
      postNexusRevenue = 0;
      
      for (const month of sortedData) {
        if (new Date(month.date) < new Date(rollingBreachDate)) {
          preNexusRevenue += month.revenue;
        } else {
          postNexusRevenue += month.revenue;
        }
      }
    }
  }
  
  return {
    hasNexus: firstBreachDate !== null,
    nexusDate: firstBreachDate,
    thresholdType: firstBreachType,
    preNexusRevenue,
    postNexusRevenue,
    nexusThresholdAmount: firstBreachType === 'revenue' ? revenueThreshold : 
                         (firstBreachType === 'transactions' ? transactionThreshold || 0 : 0),
    yearlyBreaches,
    rollingBreachDate,
    rollingBreachType
  };
};

/**
 * Calculate nexus using a rolling 12-month window
 */
export const calculateRolling12MonthNexus = (
  sortedData: MonthlyRevenue[],
  revenueThreshold: number,
  transactionThreshold: number | null
): { 
  breachDate: string | null; 
  breachType: 'revenue' | 'transactions' | null;
  windowRevenue: number;
  windowTransactions: number;
} => {
  if (sortedData.length === 0) {
    return { 
      breachDate: null, 
      breachType: null,
      windowRevenue: 0,
      windowTransactions: 0
    };
  }
  
  // Initialize window
  let windowStart = 0;
  let windowRevenue = 0;
  let windowTransactions = 0;
  
  // For each transaction, maintain a sliding window of at most 365 days
  for (let windowEnd = 0; windowEnd < sortedData.length; windowEnd++) {
    const currentDate = new Date(sortedData[windowEnd].date);
    
    // Add current month to window
    windowRevenue += sortedData[windowEnd].revenue;
    windowTransactions += sortedData[windowEnd].transactions;
    
    // Shrink window from the beginning if it exceeds 365 days
    while (windowStart < windowEnd) {
      const startDate = new Date(sortedData[windowStart].date);
      const daysDifference = getDaysDifference(startDate, currentDate);
      
      if (daysDifference <= 365) {
        break;
      }
      
      // Remove the oldest month from the window
      windowRevenue -= sortedData[windowStart].revenue;
      windowTransactions -= sortedData[windowStart].transactions;
      windowStart++;
    }
    
    // Check if thresholds are exceeded within the current window
    if (windowRevenue >= revenueThreshold) {
      return { 
        breachDate: sortedData[windowEnd].date, 
        breachType: 'revenue',
        windowRevenue,
        windowTransactions
      };
    }
    
    if (transactionThreshold !== null && windowTransactions >= transactionThreshold) {
      return { 
        breachDate: sortedData[windowEnd].date, 
        breachType: 'transactions',
        windowRevenue,
        windowTransactions
      };
    }
  }
  
  // No breach found
  return { 
    breachDate: null, 
    breachType: null,
    windowRevenue,
    windowTransactions
  };
};

/**
 * Calculate days difference between two dates, accounting for leap years
 */
export const getDaysDifference = (startDate: Date, endDate: Date): number => {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const timeDifference = endDate.getTime() - startDate.getTime();
  return Math.floor(timeDifference / millisecondsPerDay);
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