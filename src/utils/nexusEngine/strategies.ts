// Nexus Engine Strategies
// Implementation of different calculation strategies for nexus determination

import { TransactionRow, NexusResult, NexusRule, BreachResult } from './types';
import { getCurrentRule } from './rules';
import { getDaysDifference, calculateRolling12MonthNexus } from '../nexusCalculator';

/**
 * Calculate nexus for a single year
 */
export function singleYearStrategy(
  rows: TransactionRow[], 
  rule: NexusRule, 
  year: number,
  useRolling12Month: boolean = false
): NexusResult {
  // Filter rows for the specified year
  const yearRows = rows.filter(r => r.date.getUTCFullYear() === year);
  
  // Sort rows by date
  const sortedRows = [...yearRows].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate cumulative breach for calendar year
  const { sum, cnt, breachIdx, breachType } = cumulativeBreach(sortedRows, rule);
  
  // Determine if thresholds were exceeded in calendar year
  const calendarYearExceeded = breachIdx !== -1;
  
  // Create result object
  const result: NexusResult = {
    state_code: rule.state_code,
    exceeded: calendarYearExceeded,
    estimate_mode: false,
    total_revenue: sum,
    total_transactions: cnt,
    threshold_revenue: rule.amount,
    threshold_transactions: rule.txn,
    threshold_percentage: calculateThresholdPercentage(sum, cnt, rule),
    breach_type: breachType
  };
  
  // Add breach details if thresholds were exceeded in calendar year
  if (calendarYearExceeded && breachIdx !== -1) {
    result.first_breach_date = sortedRows[breachIdx].date;
    result.first_breach_transaction_id = sortedRows[breachIdx].id;
  }
  
  // If rolling 12-month calculation is enabled, check for rolling breach
  if (useRolling12Month) {
    // Use all rows, not just the current year's rows
    const allSortedRows = [...rows].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Convert TransactionRow[] to format needed by calculateRolling12MonthNexus
    const monthlyData = allSortedRows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      revenue: row.amount,
      transactions: 1
    }));
    
    const rollingResult = calculateRolling12MonthNexus(
      monthlyData,
      rule.amount,
      rule.txn
    );
    
    // If rolling breach found
    if (rollingResult.breachDate) {
      // Add rolling breach details
      result.rolling_breach = true;
      result.rolling_breach_date = new Date(rollingResult.breachDate);
      result.rolling_breach_type = rollingResult.breachType;
      
      // If no calendar year breach but rolling breach found, use rolling breach
      if (!calendarYearExceeded) {
        result.exceeded = true;
        result.first_breach_date = new Date(rollingResult.breachDate);
        result.breach_type = rollingResult.breachType;
        
        // Find the transaction ID for the breach date
        const breachTransaction = allSortedRows.find(
          row => row.date.toISOString().split('T')[0] === rollingResult.breachDate
        );
        if (breachTransaction) {
          result.first_breach_transaction_id = breachTransaction.id;
        }
      }
    }
  }
  
  return result;
}

/**
 * Calculate nexus for multiple years (estimate mode)
 */
export function multiYearEstimateStrategy(
  rows: TransactionRow[], 
  rule: NexusRule, 
  yearRange: [number, number],
  useRolling12Month: boolean = false
): NexusResult {
  const [startYear, endYear] = yearRange;
  
  // Group rows by year
  const rowsByYear: Record<number, TransactionRow[]> = {};
  for (const row of rows) {
    const year = row.date.getUTCFullYear();
    if (year >= startYear && year <= endYear) {
      if (!rowsByYear[year]) {
        rowsByYear[year] = [];
      }
      rowsByYear[year].push(row);
    }
  }
  
  // Check each year for nexus
  for (let year = startYear; year <= endYear; year++) {
    const yearRows = rowsByYear[year];
    if (!yearRows || yearRows.length === 0) continue;
    
    // Sort rows by date
    yearRows.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate cumulative breach
    const { sum, cnt, breachIdx, breachType } = cumulativeBreach(yearRows, rule);
    
    // If breach found, return result
    if (breachIdx !== -1) {
      return {
        state_code: rule.state_code,
        exceeded: true,
        first_breach_date: yearRows[breachIdx].date,
        first_breach_transaction_id: yearRows[breachIdx].id,
        estimate_mode: true,
        total_revenue: sum,
        total_transactions: cnt,
        threshold_revenue: rule.amount,
        threshold_transactions: rule.txn,
        threshold_percentage: 100, // Exceeded, so 100%
        breach_type: breachType,
        period_qualified: `${year}`
      };
    }
  }
  
  // If rolling 12-month calculation is enabled, check for rolling breach
  if (useRolling12Month) {
    // Sort all rows by date
    const allSortedRows = [...rows].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Convert TransactionRow[] to format needed by calculateRolling12MonthNexus
    const monthlyData = allSortedRows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      revenue: row.amount,
      transactions: 1
    }));
    
    const rollingResult = calculateRolling12MonthNexus(
      monthlyData,
      rule.amount,
      rule.txn
    );
    
    // If rolling breach found
    if (rollingResult.breachDate) {
      // Find the transaction for the breach date
      const breachTransaction = allSortedRows.find(
        row => row.date.toISOString().split('T')[0] === rollingResult.breachDate
      );
      
      if (breachTransaction) {
        return {
          state_code: rule.state_code,
          exceeded: true,
          first_breach_date: breachTransaction.date,
          first_breach_transaction_id: breachTransaction.id,
          estimate_mode: true,
          total_revenue: rollingResult.windowRevenue,
          total_transactions: rollingResult.windowTransactions,
          threshold_revenue: rule.amount,
          threshold_transactions: rule.txn,
          threshold_percentage: 100, // Exceeded, so 100%
          breach_type: rollingResult.breachType,
          period_qualified: 'rolling-12-month',
          rolling_breach: true,
          rolling_breach_date: breachTransaction.date,
          rolling_breach_type: rollingResult.breachType
        };
      }
    }
  }
  
  // If no breach found, calculate totals for the most recent year
  const mostRecentYear = Math.min(endYear, new Date().getUTCFullYear());
  const mostRecentRows = rowsByYear[mostRecentYear] || [];
  const sum = mostRecentRows.reduce((total, row) => total + row.amount, 0);
  const cnt = mostRecentRows.length;
  
  return {
    state_code: rule.state_code,
    exceeded: false,
    estimate_mode: true,
    total_revenue: sum,
    total_transactions: cnt,
    threshold_revenue: rule.amount,
    threshold_transactions: rule.txn,
    threshold_percentage: calculateThresholdPercentage(sum, cnt, rule),
    breach_type: null
  };
}

/**
 * Calculate cumulative breach for a set of transactions
 */
export function cumulativeBreach(rows: TransactionRow[], rule: NexusRule): BreachResult {
  let sum = 0;
  let cnt = 0;
  let breachIdx = -1;
  let breachType: 'revenue' | 'transactions' | null = null;
  
  // No threshold means no breach possible
  if (rule.amount === 0) {
    return { sum, cnt, breachIdx: -1, breachType: null };
  }
  
  // Check each transaction for breach
  for (let i = 0; i < rows.length; i++) {
    sum += rows[i].amount;
    cnt += 1;
    
    // Check revenue threshold
    if (sum >= rule.amount) {
      breachIdx = i;
      breachType = 'revenue';
      break;
    }
    
    // Check transaction threshold if applicable
    if (rule.txn !== null && cnt >= rule.txn) {
      breachIdx = i;
      breachType = 'transactions';
      break;
    }
  }
  
  return { sum, cnt, breachIdx, breachType };
}

/**
 * Calculate threshold percentage (how close to nexus)
 */
export function calculateThresholdPercentage(
  revenue: number, 
  transactions: number, 
  rule: NexusRule
): number {
  // No threshold means no percentage
  if (rule.amount === 0) return 0;
  
  // Calculate percentage of revenue threshold
  const revenuePercentage = (revenue / rule.amount) * 100;
  
  // Calculate percentage of transaction threshold if applicable
  let transactionPercentage = 0;
  if (rule.txn !== null && rule.txn > 0) {
    transactionPercentage = (transactions / rule.txn) * 100;
  }
  
  // Return the higher percentage (closer to threshold)
  return Math.max(revenuePercentage, transactionPercentage);
}