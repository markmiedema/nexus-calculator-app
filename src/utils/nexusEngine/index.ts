// Nexus Engine
// Core calculation engine for determining economic nexus

import { TransactionRow, EngineOptions, NexusResult, EngineResult, StateStats } from './types';
import { VALID_STATE_CODES, getCurrentRule, getAllCurrentRules } from './rules';
import { singleYearStrategy, multiYearEstimateStrategy } from './strategies';

/**
 * Main entry point for the Nexus Engine
 * Analyzes transaction data to determine nexus status for each state
 */
export async function analyzeNexus(
  transactions: TransactionRow[],
  options: EngineOptions
): Promise<EngineResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  
  // Validate and normalize options
  const normalizedOptions = normalizeOptions(options);
  
  // Pre-filter transactions
  const filteredTransactions = preFilterTransactions(transactions, normalizedOptions, warnings);
  
  // Group transactions by state
  const byState = groupByState(filteredTransactions);
  
  // Process each state
  const nexusResults: NexusResult[] = [];
  const stateStats: StateStats[] = [];
  
  for (const [stateCode, stateRows] of Object.entries(byState)) {
    // Get rule for this state
    const rule = getCurrentRule(stateCode);
    if (!rule) {
      warnings.push(`No nexus rule found for state: ${stateCode}`);
      continue;
    }
    
    // Sort rows by date and ID
    const sortedRows = stateRows.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      return dateCompare !== 0 ? dateCompare : a.id.localeCompare(b.id);
    });
    
    // Calculate nexus based on mode
    let result: NexusResult;
    
    switch (normalizedOptions.mode) {
      case 'singleYear':
        if (!normalizedOptions.analysisYear) {
          throw new Error('analysisYear is required for singleYear mode');
        }
        result = singleYearStrategy(sortedRows, rule, normalizedOptions.analysisYear);
        break;
        
      case 'multiYearEstimate':
        if (!normalizedOptions.yearRange) {
          throw new Error('yearRange is required for multiYearEstimate mode');
        }
        result = multiYearEstimateStrategy(sortedRows, rule, normalizedOptions.yearRange);
        break;
        
      case 'multiYearExact':
        // Not implemented in v1
        warnings.push('multiYearExact mode is not implemented in v1');
        result = {
          state_code: stateCode,
          exceeded: false,
          estimate_mode: true
        };
        break;
        
      default:
        throw new Error(`Unknown mode: ${normalizedOptions.mode}`);
    }
    
    nexusResults.push(result);
    
    // Calculate state stats
    const totalRevenue = sortedRows.reduce((sum, row) => sum + row.amount, 0);
    const totalTransactions = sortedRows.length;
    
    stateStats.push({
      state_code: stateCode,
      total_revenue: totalRevenue,
      total_transactions: totalTransactions,
      threshold_revenue: rule.amount,
      threshold_transactions: rule.txn,
      threshold_percentage: result.threshold_percentage || 0
    });
  }
  
  // Add stats for states with no transactions but have rules
  const processedStates = new Set(nexusResults.map(r => r.state_code));
  const allRules = getAllCurrentRules();
  
  for (const rule of allRules) {
    if (!processedStates.has(rule.state_code)) {
      nexusResults.push({
        state_code: rule.state_code,
        exceeded: false,
        estimate_mode: true,
        total_revenue: 0,
        total_transactions: 0,
        threshold_revenue: rule.amount,
        threshold_transactions: rule.txn,
        threshold_percentage: 0,
        breach_type: null
      });
      
      stateStats.push({
        state_code: rule.state_code,
        total_revenue: 0,
        total_transactions: 0,
        threshold_revenue: rule.amount,
        threshold_transactions: rule.txn,
        threshold_percentage: 0
      });
    }
  }
  
  return {
    nexusResults,
    stateStats,
    warnings,
    processingTime: Date.now() - startTime,
    rowsProcessed: filteredTransactions.length
  };
}

/**
 * Normalize engine options with defaults
 */
function normalizeOptions(options: EngineOptions): Required<EngineOptions> {
  const currentYear = new Date().getUTCFullYear();
  
  return {
    mode: options.mode,
    analysisYear: options.analysisYear || currentYear,
    yearRange: options.yearRange || [currentYear - 3, currentYear],
    ignoreMarketplace: options.ignoreMarketplace || false,
    includeNegativeAmounts: options.includeNegativeAmounts || false
  };
}

/**
 * Pre-filter transactions based on options
 */
function preFilterTransactions(
  transactions: TransactionRow[],
  options: Required<EngineOptions>,
  warnings: string[]
): TransactionRow[] {
  let filtered = [...transactions];
  
  // Filter out marketplace transactions if specified
  if (options.ignoreMarketplace) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(row => row.revenue_type !== 'marketplace');
    const afterCount = filtered.length;
    if (beforeCount !== afterCount) {
      warnings.push(`Filtered out ${beforeCount - afterCount} marketplace transactions`);
    }
  }
  
  // Filter out negative amounts if not included
  if (!options.includeNegativeAmounts) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(row => row.amount >= 0);
    const afterCount = filtered.length;
    if (beforeCount !== afterCount) {
      warnings.push(`Filtered out ${beforeCount - afterCount} transactions with negative amounts`);
    }
  }
  
  // Validate state codes
  const invalidStates = new Set<string>();
  filtered = filtered.filter(row => {
    if (!VALID_STATE_CODES.has(row.state_code)) {
      invalidStates.add(row.state_code);
      return false;
    }
    return true;
  });
  
  if (invalidStates.size > 0) {
    warnings.push(`Filtered out transactions with invalid state codes: ${Array.from(invalidStates).join(', ')}`);
  }
  
  return filtered;
}

/**
 * Group transactions by state
 */
function groupByState(transactions: TransactionRow[]): Record<string, TransactionRow[]> {
  const byState: Record<string, TransactionRow[]> = {};
  
  for (const row of transactions) {
    if (!byState[row.state_code]) {
      byState[row.state_code] = [];
    }
    byState[row.state_code].push(row);
  }
  
  return byState;
}

// Export types and utility functions
export * from './types';
export * from './rules';
export * from './strategies';