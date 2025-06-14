// Nexus Engine Integration
// Utilities for integrating the Nexus Engine with the existing application

import { ProcessedData, NexusState, SalesByState } from '../../types';
import { EngineResult, NexusResult } from './types';
import { getStateName } from './rules';

/**
 * Convert Nexus Engine results to the application's ProcessedData format
 */
export function convertToProcessedData(engineResult: EngineResult): ProcessedData {
  // Extract nexus states
  const nexusStates: NexusState[] = engineResult.nexusResults
    .filter(result => result.exceeded)
    .map(result => convertToNexusState(result));
  
  // Extract sales by state (include all states, not just nexus states)
  const salesByState: SalesByState[] = engineResult.stateStats.map(stat => ({
    code: stat.state_code,
    name: getStateName(stat.state_code),
    totalRevenue: stat.total_revenue,
    transactionCount: stat.total_transactions,
    monthlyRevenue: generateMonthlyRevenue(stat.total_revenue), // Generate mock monthly data
    revenueThreshold: stat.threshold_revenue,
    transactionThreshold: stat.threshold_transactions,
    thresholdProximity: stat.threshold_percentage,
    taxRate: getStateTaxRate(stat.state_code),
    annualData: generateAnnualData(stat.total_revenue) // Generate mock annual data
  }));
  
  // Calculate total liability
  const totalLiability = nexusStates.reduce((sum, state) => sum + state.liability, 0);
  
  // Sort nexus states by liability to get priority states
  const priorityStates = [...nexusStates].sort((a, b) => b.liability - a.liability);
  
  // Determine data range from engine results
  const currentYear = new Date().getFullYear();
  const dataRange = {
    start: `${currentYear - 1}-01-01`,
    end: `${currentYear}-12-31`
  };
  
  // Determine available years
  const availableYears = [
    (currentYear - 1).toString(),
    currentYear.toString()
  ];
  
  return {
    nexusStates,
    totalLiability,
    priorityStates,
    salesByState,
    dataRange,
    availableYears
  };
}

/**
 * Convert a NexusResult to a NexusState
 */
function convertToNexusState(result: NexusResult): NexusState {
  const taxRate = getStateTaxRate(result.state_code);
  const liability = calculateLiability(result.total_revenue || 0, taxRate);
  
  return {
    code: result.state_code,
    name: getStateName(result.state_code),
    totalRevenue: result.total_revenue || 0,
    transactionCount: result.total_transactions || 0,
    monthlyRevenue: generateMonthlyRevenue(result.total_revenue || 0),
    nexusDate: result.first_breach_date?.toISOString().split('T')[0] || '',
    thresholdTriggered: result.breach_type || 'revenue',
    revenueThreshold: result.threshold_revenue || 0,
    transactionThreshold: result.threshold_transactions,
    registrationDeadline: calculateRegistrationDeadline(result.first_breach_date),
    filingFrequency: determineFilingFrequency(result.total_revenue || 0),
    taxRate,
    liability,
    preNexusRevenue: 0, // Would need transaction data before nexus date
    postNexusRevenue: result.total_revenue || 0, // Simplified
    effectiveDate: result.first_breach_date?.toISOString().split('T')[0] || '',
    annualData: generateAnnualData(result.total_revenue || 0)
  };
}

/**
 * Generate mock monthly revenue data
 */
function generateMonthlyRevenue(totalRevenue: number): Array<{ date: string; revenue: number }> {
  const months = [];
  const currentYear = new Date().getFullYear();
  const monthlyAverage = totalRevenue / 12;
  
  for (let month = 1; month <= 12; month++) {
    // Add some variation to make it more realistic
    const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
    const monthlyRevenue = Math.max(0, monthlyAverage * (1 + variation));
    
    months.push({
      date: `${currentYear}-${month.toString().padStart(2, '0')}-01`,
      revenue: Math.round(monthlyRevenue)
    });
  }
  
  return months;
}

/**
 * Generate mock annual data
 */
function generateAnnualData(totalRevenue: number): Record<string, any> {
  const currentYear = new Date().getFullYear();
  return {
    [currentYear]: {
      revenue: totalRevenue,
      transactions: Math.floor(totalRevenue / 100), // Assume $100 average transaction
      taxLiability: calculateLiability(totalRevenue, 8.5) // Use average tax rate
    }
  };
}

/**
 * Get state tax rate
 */
function getStateTaxRate(stateCode: string): number {
  // This is a simplified version - would need actual tax rates
  const taxRates: Record<string, number> = {
    'AL': 9.22, 'AK': 1.76, 'AZ': 8.40, 'AR': 9.47, 'CA': 8.68, 'CO': 7.72,
    'CT': 6.35, 'DE': 0.00, 'FL': 7.08, 'GA': 7.35, 'HI': 4.44, 'ID': 6.03,
    'IL': 9.08, 'IN': 7.00, 'IA': 6.94, 'KS': 8.69, 'KY': 6.00, 'LA': 9.52,
    'ME': 5.50, 'MD': 6.00, 'MA': 6.25, 'MI': 6.00, 'MN': 7.46, 'MS': 7.07,
    'MO': 8.18, 'MT': 0.00, 'NE': 6.94, 'NV': 8.23, 'NH': 0.00, 'NJ': 6.60,
    'NM': 7.83, 'NY': 8.52, 'NC': 6.98, 'ND': 6.86, 'OH': 7.23, 'OK': 8.95,
    'OR': 0.00, 'PA': 6.34, 'RI': 7.00, 'SC': 7.46, 'SD': 6.40, 'TN': 9.55,
    'TX': 8.19, 'UT': 7.19, 'VT': 6.24, 'VA': 5.73, 'WA': 9.23, 'WV': 6.41,
    'WI': 5.43, 'WY': 5.33, 'DC': 6.00
  };
  
  return taxRates[stateCode] || 0;
}

/**
 * Calculate tax liability
 */
function calculateLiability(revenue: number, taxRate: number): number {
  return Math.round(revenue * (taxRate / 100));
}

/**
 * Calculate registration deadline (30 days after nexus date)
 */
function calculateRegistrationDeadline(nexusDate?: Date): string {
  if (!nexusDate) return '';
  
  const deadline = new Date(nexusDate);
  deadline.setDate(deadline.getDate() + 30);
  return deadline.toISOString().split('T')[0];
}

/**
 * Determine filing frequency based on revenue
 */
function determineFilingFrequency(revenue: number): string {
  if (revenue > 1000000) return 'Monthly';
  if (revenue > 50000) return 'Quarterly';
  return 'Annually';
}